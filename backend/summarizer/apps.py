# summarizer/apps.py
from django.apps import AppConfig
import os
import subprocess
import logging
import threading
from langchain_ollama import ChatOllama
from langchain.schema import HumanMessage

logger = logging.getLogger(__name__)

class SummarizerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'summarizer'

    _llm_instance = None  # Class-level LLM cache

    def ready(self):
        if os.environ.get('RUN_MAIN') != 'true':
            return  # Prevent duplicate run on code reload

        # Run warm-up in background to avoid blocking Django startup
        threading.Thread(target=self._warmup_ollama, daemon=True).start()

    def _warmup_ollama(self):
        try:
            # 1. Start Ollama server in background
            subprocess.Popen(['ollama', 'serve'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            logger.info("✅ Ollama server started on runserver")

            # 2. Pull model (only if not already pulled)
            subprocess.run(['ollama', 'pull', 'llama3:8b-instruct-q4_0'], check=True)
            logger.info("📦 Model pulled")

            # 3. Load and warm-up
            self.__class__._llm_instance = ChatOllama(
                model='llama3:8b-instruct-q4_0',
                temperature=0.3
            )
            self._llm_instance.invoke([HumanMessage(content="Warm up the model")])
            logger.info("🔥 Model warmed up")

        except Exception as e:
            logger.error(f"❌ Ollama warm-up failed: {str(e)}")

    @classmethod
    def get_llm(cls):
        if cls._llm_instance is None:
            cls()._warmup_ollama()
        return cls._llm_instance
