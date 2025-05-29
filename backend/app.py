from dotenv import load_dotenv
load_dotenv()

import os
from google import generativeai as genai
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uvicorn
import tempfile
import os
import subprocess
import time
import random
import math
import concurrent.futures
import base64
import re
import requests

app = FastAPI(title="PV Generation API")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # URL de votre frontend Next.js
    allow_credentials=True,
    allow_methods=["*"],  # Autorise toutes les méthodes HTTP
    allow_headers=["*"],  # Autorise tous les headers
)

# --- Helper Functions ---

def extract_file_id_from_url(url):
    patterns = [
        r"https://drive\.google\.com/file/d/([a-zA-Z0-9_-]+)",
        r"https://drive\.google\.com/open\?id=([a-zA-Z0-9_-]+)",
        r"https://drive\.google\.com/uc\?id=([a-zA-Z0-9_-]+)",
        r"id=([a-zA-Z0-9_-]+)"
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def download_video_from_drive(video_url, output_path):
    try:
        file_id = extract_file_id_from_url(video_url)
        if not file_id:
            return False, "URL Google Drive non reconnue."
        session = requests.Session()
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        download_url = f'https://drive.usercontent.google.com/download?id={file_id}&export=download&authuser=0&confirm=t'
        response = session.get(download_url, headers=headers, stream=True, timeout=30)
        content_type = response.headers.get('Content-Type', '').lower()
        if 'text/html' in content_type:
            # Try alternative URL for large files
            download_url = f'https://drive.usercontent.google.com/download?id={file_id}&export=download&authuser=0&confirm=t&uuid=123&at=123'
            response = session.get(download_url, headers=headers, stream=True, timeout=30)
            content_type = response.headers.get('Content-Type', '').lower()
            if 'text/html' in content_type:
                return False, "Impossible d'accéder au fichier. Vérifiez les droits de partage."
        temp_path = output_path + ".tmp"
        try:
            chunk_size = 500 * 1024 * 1024
            downloaded_size = 0
            expected_size = None
            if 'content-length' in response.headers:
                expected_size = int(response.headers['content-length'])
            with open(temp_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=chunk_size):
                    if chunk:
                        f.write(chunk)
                        downloaded_size += len(chunk)
            # Check file
            if os.path.exists(temp_path):
                file_size = os.path.getsize(temp_path)
                if file_size < 10000:
                    os.remove(temp_path)
                    return False, "Fichier téléchargé trop petit."
                # Optionally: check VRO header (not enforced here)
                try:
                    if os.path.exists(output_path):
                        os.remove(output_path)
                    os.rename(temp_path, output_path)
                except Exception as e:
                    import shutil
                    try:
                        shutil.copy2(temp_path, output_path)
                        os.remove(temp_path)
                    except Exception as e2:
                        return False, f"Erreur lors de la copie: {str(e2)}"
                return True, None
            else:
                return False, "Erreur lors de l'écriture du fichier."
        except Exception as e:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return False, f"Erreur pendant le téléchargement: {str(e)}"
    except Exception as e:
        if os.path.exists(output_path):
            os.remove(output_path)
        return False, f"Erreur inattendue: {str(e)}"

def verify_video_file(file_path):
    """Check if the video file is valid using ffprobe."""
    if not os.path.exists(file_path):
        return False, f"File {file_path} does not exist."
    file_size = os.path.getsize(file_path)
    if file_size < 10000:
        return False, "File is too small to be a valid video."
    probe_command = [
        "ffprobe", "-v", "error", "-show_format", "-show_streams", file_path
    ]
    result = subprocess.run(probe_command, capture_output=True, text=True)
    if result.returncode != 0:
        return False, f"Invalid video format: {result.stderr}"
    return True, None

def extract_audio_from_video(input_video_path, output_audio_path):
    """Extract audio from video using ffmpeg."""
    if not os.path.exists(input_video_path):
        return False, "Video file does not exist."
    if os.path.getsize(input_video_path) == 0:
        return False, "Video file is empty."
    # Convert VRO to MP4 if needed (not implemented here)
    extract_command = [
        'ffmpeg', '-i', input_video_path, '-vn', '-acodec', 'libmp3lame',
        '-ar', '44100', '-ab', '192k', '-y', output_audio_path
    ]
    result = subprocess.run(extract_command, capture_output=True, text=True)
    if result.returncode != 0:
        return False, f"Audio extraction error: {result.stderr}"
    if not os.path.exists(output_audio_path) or os.path.getsize(output_audio_path) == 0:
        return False, "Audio file not created or is empty."
    return True, None

def segment_audio(audio_path, segment_length_ms=120000):
    """Split audio into segments using ffmpeg."""
    try:
        result = subprocess.run([
            'ffprobe', '-v', 'error', '-show_entries',
            'format=duration', '-of',
            'default=noprint_wrappers=1:nokey=1', audio_path
        ], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        total_duration = float(result.stdout)
        segment_length_sec = segment_length_ms / 1000
        num_segments = math.ceil(total_duration / segment_length_sec)
        segment_paths = []
        temp_dir = tempfile.gettempdir()
        for i in range(num_segments):
            start_time = i * segment_length_sec
            temp_segment_path = os.path.join(temp_dir, f"segment_{i+1}_{os.path.basename(audio_path)}.mp3")
            extract_cmd = [
                "ffmpeg", "-y", "-i", audio_path, "-ss", str(start_time),
                "-t", str(segment_length_sec), "-c", "copy", temp_segment_path
            ]
            subprocess.run(extract_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
            if os.path.exists(temp_segment_path):
                segment_paths.append(temp_segment_path)
        return segment_paths
    except Exception as e:
        return []

def transcribe_audio_segments(segments, batch_size=10, timeout=30):
    """Transcribe audio segments using Gemini API."""
    full_transcript = []
    for batch_start in range(0, len(segments), batch_size):
        batch_transcript = []
        for i in range(batch_start, min(batch_start + batch_size, len(segments))):
            segment_path = segments[i]
            try:
                with open(segment_path, "rb") as f:
                    audio_bytes = f.read()
                print(f"Segment {i+1} size: {len(audio_bytes)} bytes")
                model = genai.GenerativeModel('gemini-2.0-flash')
                
                # Retry logic inside the segment processing
                @retry_with_backoff
                def call_gemini_with_retry():
                    print(f"Attempting transcription for segment {i+1}...")
                    response = model.generate_content([
                        "Transcrivez ce segment audio mot pour mot en français.",
                        {"mime_type": "audio/mp3", "data": audio_bytes}
                    ])
                    print(f"Gemini response status for segment {i+1}: {response.candidates[0].finish_reason if response.candidates else 'No candidates'}")
                    return response.text

                transcript_text = call_gemini_with_retry()
                
                if transcript_text:
                    batch_transcript.append(transcript_text)
                else:
                    print(f"Segment {i+1} returned no text from Gemini.")
                    batch_transcript.append(f"[Segment {i+1} non transcrit ou vide]")
                    
                os.remove(segment_path)
                    
            except concurrent.futures.TimeoutError:
                print(f"Segment {i+1} timed out during transcription.")
                batch_transcript.append(f"[Segment {i+1} timeout]")
            except Exception as e:
                print(f"Error transcribing segment {i+1}: {str(e)}") # Log the specific error
                batch_transcript.append(f"[Segment {i+1} error: {str(e)}]")
                # Decide if we should continue with other segments or break
                # For now, we continue
            time.sleep(random.uniform(1, 2)) # Add a small delay between segment calls
            
        full_transcript.extend(batch_transcript)
        
    return full_transcript

def retry_with_backoff(func, max_retries=5, initial_delay=1):
    """Fonction utilitaire pour réessayer une opération avec un délai exponentiel"""
    def wrapper(*args, **kwargs):
        delay = initial_delay
        last_exception = None
        
        for attempt in range(max_retries):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                last_exception = e
                error_code = str(e)
                if "429" in error_code or "499" in error_code: 
                    print(f"⚠️ Erreur API ({error_code}), nouvelle tentative {attempt + 1}/{max_retries} dans {delay} secondes...")
                    time.sleep(delay)
                    delay *= 2
                else:
                    raise e
        
        print(f"❌ Échec après {max_retries} tentatives : {str(last_exception)}")
        return None
    
    return wrapper

def process_handwritten_image(image_bytes):
    """Extrait le texte d'une image manuscrite avec mécanisme de retry"""
    @retry_with_backoff
    def transcribe_image():
        try:
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
            
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            prompt = """Transcris précisément le texte manuscrit dans cette image.
            INSTRUCTIONS :
            1. Retourne uniquement le texte, sans commentaires
            2. Préserve la mise en forme (retours à la ligne, espacements)
            3. Conserve la ponctuation exacte
            4. Maintiens les nombres et symboles tels quels
            5. Respecte les majuscules et minuscules"""
            
            response = model.generate_content([
                prompt,
                {"mime_type": "image/jpeg", "data": image_base64}
            ])
            
            if response.text:
                return response.text.strip()
            else:
                raise Exception("Aucun texte détecté dans l'image.")
                
        except Exception as e:
            print(f"⚠️ Tentative de transcription échouée : {str(e)}")
            raise e

    try:
        # Premier essai
        result = transcribe_image()
        if result:
            return result
            
        # Si le résultat est vide, on attend et on réessaie
        time.sleep(2)
        print("🔄 Nouvelle tentative de transcription...")
        
        # Deuxième essai avec un prompt plus détaillé
        prompt_retry = """Analyse et transcris TOUT le texte manuscrit visible dans cette image.
        IMPORTANT :
        - Examine l'image en détail, pixel par pixel
        - Transcris absolument tout le texte visible
        - N'oublie aucun détail, même les petites annotations
        - Conserve la structure exacte du texte
        - Inclus les numéros, symboles et caractères spéciaux"""
        
        model = genai.GenerativeModel('gemini-2.0-flash')
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        response = model.generate_content([
            prompt_retry,
            {"mime_type": "image/jpeg", "data": image_base64}
        ])
        
        if response.text:
            return response.text.strip()
        else:
            print("⚠️ Aucun texte n'a été détecté dans l'image après plusieurs tentatives.")
            return ""
            
    except Exception as e:
        print(f"❌ Erreur lors de la reconnaissance du texte : {str(e)}")
        return ""

def process_pdf(pdf_bytes):
    """Extrait le contenu détaillé et les acronymes d'un PDF en un seul appel."""
    try:
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        prompt = """Analyse ce document PDF de manière EXHAUSTIVE et DÉTAILLÉE.
        
        INSTRUCTIONS SPÉCIFIQUES :
        
        1. EXTRACTION COMPLÈTE DU CONTENU :
           - Extraire TOUS les textes, exactement comme ils apparaissent.
           - Conserver TOUS les chiffres, statistiques, données numériques avec leurs unités.
           - Maintenir TOUS les tableaux avec leurs données complètes.
           - Décrire TOUS les graphiques avec leurs valeurs précises.
           - Capturer TOUTES les notes de bas de page et références.
           - Respecter la structure (sections, titres, listes).
           - NE PAS résumer ou synthétiser le corps du texte.
           
        2. EXTRACTION DES ACRONYMES :
           - Identifier TOUS les acronymes présents dans le document.
           - Si l'acronyme est défini explicitement dans le texte, utiliser cette définition EXACTE.
           - Si l'acronyme n'est PAS défini dans le texte, rechercher sa définition officielle connue dans des sources fiables.
           - Lister les acronymes et leurs définitions SÉPARÉMENT à la fin.
        
        3. FORMAT DE SORTIE ATTENDU :
           - D'abord, le contenu complet et détaillé du document, en respectant sa structure.
           - Ensuite, une ligne de séparation claire comme : '--- ACRONYMES ---'.
           - Enfin, la liste des acronymes, un par ligne, au format : 'ACRONYME: Définition complète'.
           
        IMPORTANT : Assure-toi de bien séparer le contenu principal de la liste des acronymes avec '--- ACRONYMES ---'."""
        
        @retry_with_backoff
        def analyze_pdf_and_extract_acronyms():
            response = model.generate_content([
                {
                    "role": "user",
                    "parts": [
                        prompt,
                        {"mime_type": "application/pdf", "data": pdf_base64}
                    ]
                }
            ])
            return response.text if response.text else ""
        
        full_result = analyze_pdf_and_extract_acronyms()
        
        if not full_result:
            print(f"⚠️ Aucun contenu extrait du PDF")
            return {"summary": "", "acronyms": {}}
            
        # Séparer le contenu et les acronymes
        separator = "--- ACRONYMES ---"
        if separator in full_result:
            summary_part, acronym_part = full_result.split(separator, 1)
            summary = summary_part.strip()
            
            # Parser les acronymes
            acronyms = {}
            lines = acronym_part.strip().split('\n')
            for line in lines:
                if ':' in line:
                    acronym, definition = line.split(':', 1)
                    acronym = acronym.strip().upper()
                    definition = definition.strip()
                    if acronym and definition:
                        acronyms[acronym] = definition
            return {"summary": summary, "acronyms": acronyms}
        else:
            # Si le séparateur n'est pas trouvé, retourner tout comme résumé et pas d'acronymes
            print(f"⚠️ Séparateur d'acronymes non trouvé dans l'analyse")
            return {"summary": full_result.strip(), "acronyms": {}}
            
    except Exception as e:
        print(f"❌ Erreur lors de l'analyse du PDF: {str(e)}")
        return {"summary": f"[Erreur lors de l'analyse du PDF: {str(e)}]", "acronyms": {}}

# --- API Endpoints ---

@app.post("/transcribe_video")
async def transcribe_video(
    video: Optional[UploadFile] = File(None),
    drive_url: Optional[str] = Form(None)
):
    """Full video transcription pipeline. Accepts file upload or Google Drive link."""
    print(f"Received request - video: {video}, drive_url: {drive_url}")
    
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # 1. Handle file upload or Google Drive link
            if video is not None:
                print(f"Processing uploaded video: {video.filename}")
                ext = os.path.splitext(video.filename)[1].lower() if video.filename else '.mp4'
                video_temp_path = os.path.join(temp_dir, f"uploaded_video{ext}")
                with open(video_temp_path, 'wb') as out_file:
                    while True:
                        chunk = await video.read(1024 * 1024)
                        if not chunk:
                            break
                        out_file.write(chunk)
                print(f"Video saved to: {video_temp_path}")
            elif drive_url:
                print(f"Processing drive URL: {drive_url}")
                video_temp_path = os.path.join(temp_dir, "downloaded_video.mp4")
                ok, err = download_video_from_drive(drive_url, video_temp_path)
                if not ok:
                    print(f"Drive download failed: {err}")
                    return JSONResponse(status_code=400, content={"error": err})
            else:
                print("No video file or drive_url provided")
                return JSONResponse(status_code=400, content={"error": "No video file or drive_url provided."})
            
            # 2. Verify video
            print("Verifying video file...")
            valid, err = verify_video_file(video_temp_path)
            if not valid:
                print(f"Video verification failed: {err}")
                return JSONResponse(status_code=400, content={"error": err})
            
            # 3. Extract audio
            print("Extracting audio...")
            audio_path = os.path.join(temp_dir, "output_audio.mp3")
            ok, err = extract_audio_from_video(video_temp_path, audio_path)
            if not ok:
                print(f"Audio extraction failed: {err}")
                return JSONResponse(status_code=400, content={"error": err})
            
            # 4. Segment audio
            print("Segmenting audio...")
            segments = segment_audio(audio_path)
            if not segments:
                print("Audio segmentation failed")
                return JSONResponse(status_code=400, content={"error": "Audio segmentation failed."})
            
            # 5. Transcribe segments
            print("Transcribing segments...")
            print("Video temp path:", video_temp_path)
            print("Audio path:", audio_path)
            print("Number of segments:", len(segments))
            transcript_segments = transcribe_audio_segments(segments)
            transcript = "\n".join(transcript_segments)
            print("Transcription completed successfully")
            return {"transcript": transcript}
            
        except Exception as e:
            print(f"Error in transcribe_video: {str(e)}")
            return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/transcribe_audio")
async def transcribe_audio(audio: Optional[UploadFile] = File(None)):
    """Pipeline complet de transcription pour un fichier audio (uploadé ou enregistré)"""
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            if audio is None:
                return JSONResponse(status_code=400, content={"error": "Aucun fichier audio fourni."})
            
            ext = os.path.splitext(audio.filename)[1].lower() if audio.filename else '.mp3'
            audio_temp_path = os.path.join(temp_dir, f"uploaded_audio{ext}")

            # 1. Sauvegarder le fichier audio temporairement
            with open(audio_temp_path, 'wb') as out_file:
                while True:
                    chunk = await audio.read(1024 * 1024)
                    if not chunk:
                        break
                    out_file.write(chunk)

            # 2. Convertir en MP3 si besoin
            if ext != ".mp3":
                converted_audio_path = os.path.join(temp_dir, "converted_audio.mp3")
                convert_cmd = [
                    "ffmpeg", "-y", "-i", audio_temp_path,
                    "-acodec", "libmp3lame", "-ar", "44100", "-b:a", "192k",
                    converted_audio_path
                ]
                subprocess.run(convert_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                audio_path = converted_audio_path
            else:
                audio_path = audio_temp_path

            # 3. Segmenter
            segments = segment_audio(audio_path)
            if not segments:
                return JSONResponse(status_code=400, content={"error": "Échec de la segmentation audio."})

            # 4. Transcrire
            print("Audio path:", audio_path)
            print("Segments:", segments)
            transcript_segments = transcribe_audio_segments(segments)
            transcript = "\n".join(transcript_segments)

            return {"transcript": transcript}

        except Exception as e:
            return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/ocr_handwritten")
async def ocr_handwritten(images: List[UploadFile] = File(...)):
    """Transcrit le texte manuscrit à partir d'une ou plusieurs images."""
    try:
        results = {}
        for image in images:
            try:
                # Lire le contenu de l'image
                image_bytes = await image.read()
                
                # Traiter l'image
                transcription = process_handwritten_image(image_bytes)
                
                # Stocker le résultat
                results[image.filename] = {
                    "success": True,
                    "text": transcription
                }
                
            except Exception as e:
                results[image.filename] = {
                    "success": False,
                    "error": str(e)
                }
        
        return {"results": results}
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Erreur lors du traitement des images : {str(e)}"}
        )

@app.post("/extract_pdf")
async def extract_pdf(pdf: UploadFile = File(...)):
    """Extrait le contenu et les acronymes d'un PDF."""
    try:
        # Lire le contenu du PDF
        pdf_bytes = await pdf.read()
        
        # Traiter le PDF
        result = process_pdf(pdf_bytes)
        
        # Ajouter le nom du fichier au résultat
        result["filename"] = pdf.filename
        
        return result
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Erreur lors du traitement du PDF : {str(e)}"}
        )

@app.post("/generate_pv")
async def generate_pv(
    video_transcript: Optional[str] = Form(None),
    audio_transcript: Optional[str] = Form(None),
    handwritten_text: Optional[str] = Form(None),
    pdf_summary: Optional[str] = Form(None),
    meeting_info: Optional[str] = Form(None)
):
    # Placeholder: implement PV generation logic
    return {"pv": "Generated meeting minutes here."}

# Uncomment to run directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)