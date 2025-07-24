from pydantic import BaseModel, Field
from datetime import datetime, timezone
from bson import ObjectId
from typing import List, Optional, Dict, Any
from enum import Enum

class EyeCondition(str, Enum):
    NORMAL = "Normal"
    DIABETIC_RETINOPATHY = "Diabetic Retinopathy"
    GLAUCOMA = "Glaucoma"
    CATARACT = "Cataract"

class SeverityLevel(str, Enum):
    MILD = "Mild"
    MODERATE = "Moderate"
    SEVERE = "Severe"

class EyeAnalysisResult(BaseModel):
    condition: EyeCondition
    confidence: float = Field(ge=0.0, le=100.0)
    severity: Optional[SeverityLevel] = None
    probability_scores: Dict[str, float] = {}
    clinical_notes: str = ""
    
    def get_medical_recommendation(self) -> str:
        """Generate medical recommendations based on findings"""
        if self.condition == EyeCondition.NORMAL:
            return "No abnormalities detected. Continue regular eye examinations annually."
        
        recommendations = {
            EyeCondition.DIABETIC_RETINOPATHY: {
                SeverityLevel.MILD: "Mild diabetic retinopathy detected. Annual diabetic eye exams and glucose control essential. Reference: ETDRS Research Group, 1991.",
                SeverityLevel.MODERATE: "Moderate diabetic retinopathy. Ophthalmologist consultation within 6 months. Consider anti-VEGF therapy. Reference: Wilkinson et al., Ophthalmology 2003.",
                SeverityLevel.SEVERE: "Severe diabetic retinopathy. Immediate ophthalmologist referral for treatment to prevent vision loss. Reference: ETDRS Report #1, Arch Ophthalmol 1991."
            },
            EyeCondition.GLAUCOMA: {
                SeverityLevel.MILD: "Possible early glaucoma. Comprehensive eye exam with visual field testing and OCT recommended. Reference: Weinreb & Khaw, Lancet 2004.",
                SeverityLevel.MODERATE: "Moderate glaucoma suspect. Immediate treatment needed to prevent vision loss. IOP monitoring essential. Reference: OHTS Group, Arch Ophthalmol 2002.",
                SeverityLevel.SEVERE: "Advanced glaucoma changes. Urgent specialist care required. Consider surgical intervention. Reference: Heijl et al., Arch Ophthalmol 2002."
            },
            EyeCondition.CATARACT: {
                SeverityLevel.MILD: "Early cataract formation. Monitor progression with regular exams. Consider surgery when vision affected. Reference: Asbell et al., Lancet 2005.",
                SeverityLevel.MODERATE: "Moderate cataract. Surgical consultation recommended if vision impairment affects daily activities. Reference: West & Valmadrid, Survey Ophthalmol 1995.",
                SeverityLevel.SEVERE: "Advanced cataract. Surgical intervention likely needed to restore vision. Reference: Congdon et al., Ophthalmology 2004."
            }
        }
        
        return recommendations.get(self.condition, {}).get(
            self.severity, 
            f"{self.condition.value} detected. Consult with an eye care professional for evaluation."
        )

class EyeScanData(BaseModel):
    scan_id: str = Field(default_factory=lambda: str(ObjectId()))
    user_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Patient Information
    age: int = Field(ge=1, le=120)
    gender: str = Field(pattern="^(male|female|other)$")
    
    # Image Data (base64 encoded)
    left_eye_image: str
    right_eye_image: str
    
    # AI Analysis Results
    left_eye_analysis: Optional[EyeAnalysisResult] = None
    right_eye_analysis: Optional[EyeAnalysisResult] = None
    
    # Overall Assessment
    overall_risk_level: str = "Unknown"
    bilateral_findings: List[str] = []
    clinical_summary: str = ""
    
    # Medical References
    study_references: List[str] = []
    
    # Processing Status
    is_processed: bool = False
    processing_error: Optional[str] = None
    
    def calculate_overall_assessment(self):
        """Calculate overall risk based on both eyes"""
        if not self.left_eye_analysis or not self.right_eye_analysis:
            return
        
        # Get conditions and severities
        left_condition = self.left_eye_analysis.condition
        right_condition = self.right_eye_analysis.condition
        left_severity = self.left_eye_analysis.severity
        right_severity = self.right_eye_analysis.severity
        
        # Determine overall risk
        if left_condition == EyeCondition.NORMAL and right_condition == EyeCondition.NORMAL:
            self.overall_risk_level = "Low Risk"
        elif any(sev == SeverityLevel.SEVERE for sev in [left_severity, right_severity] if sev):
            self.overall_risk_level = "High Risk"
        elif any(sev == SeverityLevel.MODERATE for sev in [left_severity, right_severity] if sev):
            self.overall_risk_level = "Moderate Risk"
        else:
            self.overall_risk_level = "Low to Moderate Risk"
        
        # Check for bilateral findings
        if left_condition == right_condition and left_condition != EyeCondition.NORMAL:
            self.bilateral_findings.append(f"Bilateral {left_condition.value}")
        
        # Generate clinical summary and references
        self.create_clinical_summary()
        self.add_study_references()
    
    def create_clinical_summary(self):
        """Generate comprehensive clinical summary"""
        left_condition = self.left_eye_analysis.condition.value
        right_condition = self.right_eye_analysis.condition.value
        
        summary_parts = [
            f"Patient: {self.age} years, {self.gender.capitalize()}",
            f"Left Eye: {left_condition}",
            f"Right Eye: {right_condition}",
            f"Overall Risk: {self.overall_risk_level}"
        ]
        
        if self.bilateral_findings:
            summary_parts.extend(self.bilateral_findings)
        
        self.clinical_summary = "\n".join(summary_parts)
    
    def add_study_references(self):
        """Add relevant medical study references"""
        references = set()
        
        conditions = [self.left_eye_analysis.condition, self.right_eye_analysis.condition]
        
        for condition in conditions:
            if condition == EyeCondition.DIABETIC_RETINOPATHY:
                references.add("Early Treatment Diabetic Retinopathy Study Research Group. ETDRS Report Number 1. Arch Ophthalmol. 1991;109(12):1677-1684.")
                references.add("Wilkinson CP, et al. Proposed international clinical diabetic retinopathy disease severity scales. Ophthalmology. 2003;110(9):1677-1682.")
            elif condition == EyeCondition.GLAUCOMA:
                references.add("Weinreb RN, Khaw PT. Primary open-angle glaucoma. The Lancet. 2004;363(9422):1711-1720.")
                references.add("Kass MA, et al. The Ocular Hypertension Treatment Study. Arch Ophthalmol. 2002;120(6):701-713.")
            elif condition == EyeCondition.CATARACT:
                references.add("Asbell PA, et al. Age-related cataract. The Lancet. 2005;365(9459):599-609.")
                references.add("West SK, Valmadrid CT. Epidemiology of risk factors for age-related cataract. Survey of Ophthalmology. 1995;39(4):323-334.")
        
        self.study_references = list(references)

class EyeScanRequest(BaseModel):
    left_eye_image: str  # base64 encoded
    right_eye_image: str  # base64 encoded
    age: int = Field(ge=1, le=120)
    gender: str = Field(pattern="^(male|female|other)$")

class EyeScanResponse(BaseModel):
    scan_id: str
    message: str
    left_eye_result: Optional[EyeAnalysisResult] = None
    right_eye_result: Optional[EyeAnalysisResult] = None
    overall_assessment: str
    recommendations: List[str] = []
    study_references: List[str] = []
    timestamp: datetime
    model_info: Dict[str, str] = {
        "model_type": "Single TensorFlow Lite Model",
        "detectable_conditions": "Normal, Diabetic Retinopathy, Glaucoma, Cataract"
    }