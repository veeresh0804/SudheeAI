import logging
import json
import re
from typing import Dict, Any, Optional, Type
from pydantic import BaseModel, ValidationError
import google.generativeai as genai
import time

logger = logging.getLogger("sudhee-ai-intelligence")

class AIResponseSanitizer:
    """Sanitize AI responses by removing markdown wrappers and cleaning JSON."""
    
    @staticmethod
    def sanitize(raw_response: str) -> str:
        """
        Remove markdown code blocks and clean JSON response.
        
        Common patterns to handle:
        - ```json ... ```
        - ``` ... ```
        - Leading/trailing whitespace
        - Markdown formatting
        """
        if not raw_response:
            return "{}"
        
        # Remove markdown code blocks
        response = raw_response.strip()
        
        # Pattern 1: ```json ... ```
        if response.startswith("```json"):
            response = re.sub(r'^```json\s*', '', response)
            response = re.sub(r'\s*```$', '', response)
        
        # Pattern 2: ``` ... ```
        elif response.startswith("```"):
            response = re.sub(r'^```\s*', '', response)
            response = re.sub(r'\s*```$', '', response)
        
        # Remove any remaining backticks
        response = response.replace("```", "")
        
        # Strip whitespace
        response = response.strip()
        
        return response

class AIResponseValidator:
    """Validate AI responses against Pydantic schemas with strict enforcement."""
    
    @staticmethod
    def validate(
        response_text: str,
        schema: Type[BaseModel],
        context: str = "unknown"
    ) -> tuple[bool, Optional[BaseModel], Optional[str]]:
        """
        Validate response against Pydantic schema.
        
        Returns:
            (is_valid, parsed_data, error_message)
        """
        try:
            # First sanitize the response
            clean_text = AIResponseSanitizer.sanitize(response_text)
            
            # Parse JSON
            json_data = json.loads(clean_text)
            
            # Validate against schema
            validated_data = schema(**json_data)
            
            logger.info(f"AI response validated successfully", extra={
                "props": {"context": context}
            })
            
            return (True, validated_data, None)
            
        except json.JSONDecodeError as e:
            error_msg = f"JSON parsing error: {str(e)}"
            logger.error(f"AI response JSON parsing failed", extra={
                "props": {
                    "context": context,
                    "error": error_msg,
                    "response_preview": response_text[:200]
                }
            })
            return (False, None, error_msg)
            
        except ValidationError as e:
            error_msg = f"Validation error: {str(e)}"
            logger.error(f"AI response validation failed", extra={
                "props": {
                    "context": context,
                    "error": error_msg
                }
            })
            return (False, None, error_msg)
            
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(f"AI response processing failed", extra={
                "props": {
                    "context": context,
                    "error": error_msg
                }
            })
            return (False, None, error_msg)

class AIOrchestrator:
    """
    Centralized AI orchestration layer for all Gemini interactions.
    Handles retries, validation, sanitization, and fallback logic.
    """
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
    
    async def generate_with_validation(
        self,
        prompt: str,
        schema: Type[BaseModel],
        context: str = "unknown",
        fallback_data: Optional[Dict] = None,
        max_retries: int = 1
    ) -> tuple[bool, Optional[BaseModel], Dict]:
        """
        Generate AI response with strict validation and retry logic.
        
        Args:
            prompt: The prompt to send to Gemini
            schema: Pydantic schema for validation
            context: Context for logging
            fallback_data: Data to use if AI fails
            max_retries: Maximum retry attempts (default 1)
        
        Returns:
            (success, validated_data, metadata)
        """
        metadata = {
            "retries": 0,
            "fallback_used": False,
            "latency_ms": 0,
            "tokens_used": 0,
            "validation_error": None
        }
        
        for attempt in range(max_retries + 1):
            try:
                start_time = time.time()
                
                # Call Gemini
                response = self.model.generate_content(prompt)
                raw_text = response.text
                
                latency_ms = int((time.time() - start_time) * 1000)
                metadata["latency_ms"] = latency_ms
                
                # Estimate tokens (rough approximation: 1 token ≈ 4 chars)
                metadata["tokens_used"] = len(prompt + raw_text) // 4
                
                # Validate response
                is_valid, validated_data, error_msg = AIResponseValidator.validate(
                    raw_text, schema, context
                )
                
                if is_valid:
                    logger.info(f"AI generation successful", extra={
                        "props": {
                            "context": context,
                            "latency_ms": latency_ms,
                            "attempt": attempt + 1
                        }
                    })
                    return (True, validated_data, metadata)
                
                # Validation failed
                metadata["validation_error"] = error_msg
                metadata["retries"] = attempt + 1
                
                # Log anomaly
                self._log_anomaly(context, raw_text, error_msg, attempt)
                
                if attempt < max_retries:
                    logger.warning(f"Retrying AI call", extra={
                        "props": {
                            "context": context,
                            "attempt": attempt + 1,
                            "error": error_msg
                        }
                    })
                    continue
                
                # Max retries reached - use fallback
                logger.error(f"AI validation failed after retries", extra={
                    "props": {
                        "context": context,
                        "retries": attempt + 1
                    }
                })
                
            except Exception as e:
                logger.error(f"AI generation error", extra={
                    "props": {
                        "context": context,
                        "error": str(e),
                        "attempt": attempt + 1
                    }
                })
                metadata["retries"] = attempt + 1
        
        # Use fallback if provided
        if fallback_data:
            metadata["fallback_used"] = True
            try:
                fallback_validated = schema(**fallback_data)
                logger.info(f"Using fallback data", extra={
                    "props": {"context": context}
                })
                return (True, fallback_validated, metadata)
            except:
                pass
        
        return (False, None, metadata)
    
    def _log_anomaly(
        self,
        context: str,
        raw_response: str,
        error_message: str,
        retry_count: int
    ):
        """Log AI anomaly for monitoring."""
        # In production, this would write to ai_anomaly_logs table
        logger.warning("AI Anomaly Detected", extra={
            "props": {
                "context": context,
                "error": error_message,
                "retry_count": retry_count,
                "response_length": len(raw_response)
            }
        })
