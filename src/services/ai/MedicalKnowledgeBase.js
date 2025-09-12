// MedicalKnowledgeBase.js - Medical receptionist training data and knowledge

class MedicalKnowledgeBase {
  constructor() {
    this.clinicInfo = {
      name: "Azure Medical Center",
      address: "123 Healthcare Blvd, Seattle, WA 98101",
      phone: "(206) 555-0100",
      fax: "(206) 555-0101",
      email: "info@azuremedicalcenter.com",
      hours: {
        monday: { open: "8:00 AM", close: "6:00 PM" },
        tuesday: { open: "8:00 AM", close: "6:00 PM" },
        wednesday: { open: "8:00 AM", close: "6:00 PM" },
        thursday: { open: "8:00 AM", close: "6:00 PM" },
        friday: { open: "8:00 AM", close: "6:00 PM" },
        saturday: { open: "9:00 AM", close: "2:00 PM" },
        sunday: { open: "Closed", close: "Closed" }
      },
      holidays: [
        "New Year's Day", "Memorial Day", "Independence Day",
        "Labor Day", "Thanksgiving", "Christmas"
      ]
    };

    this.doctors = [
      {
        name: "Dr. Sarah Johnson",
        specialty: "Family Medicine",
        languages: ["English", "Spanish"],
        availability: {
          monday: ["9:00 AM - 12:00 PM", "2:00 PM - 5:00 PM"],
          tuesday: ["9:00 AM - 12:00 PM", "2:00 PM - 5:00 PM"],
          wednesday: ["9:00 AM - 12:00 PM"],
          thursday: ["9:00 AM - 12:00 PM", "2:00 PM - 5:00 PM"],
          friday: ["9:00 AM - 12:00 PM", "2:00 PM - 5:00 PM"]
        },
        newPatients: true,
        consultationTime: 30
      },
      {
        name: "Dr. Michael Chen",
        specialty: "Internal Medicine",
        languages: ["English", "Mandarin"],
        availability: {
          monday: ["10:00 AM - 1:00 PM", "2:00 PM - 6:00 PM"],
          tuesday: ["10:00 AM - 1:00 PM", "2:00 PM - 6:00 PM"],
          wednesday: ["10:00 AM - 1:00 PM", "2:00 PM - 6:00 PM"],
          thursday: ["10:00 AM - 1:00 PM"],
          friday: ["10:00 AM - 1:00 PM", "2:00 PM - 6:00 PM"]
        },
        newPatients: true,
        consultationTime: 30
      },
      {
        name: "Dr. Emily Rodriguez",
        specialty: "Pediatrics",
        languages: ["English", "Spanish", "Portuguese"],
        availability: {
          monday: ["8:00 AM - 12:00 PM", "1:00 PM - 5:00 PM"],
          tuesday: ["8:00 AM - 12:00 PM", "1:00 PM - 5:00 PM"],
          wednesday: ["8:00 AM - 12:00 PM"],
          thursday: ["8:00 AM - 12:00 PM", "1:00 PM - 5:00 PM"],
          friday: ["8:00 AM - 12:00 PM"]
        },
        newPatients: true,
        consultationTime: 20
      },
      {
        name: "Dr. Robert Williams",
        specialty: "Cardiology",
        languages: ["English"],
        availability: {
          tuesday: ["9:00 AM - 12:00 PM", "2:00 PM - 5:00 PM"],
          thursday: ["9:00 AM - 12:00 PM", "2:00 PM - 5:00 PM"]
        },
        newPatients: false,
        requiresReferral: true,
        consultationTime: 45
      },
      {
        name: "Dr. Lisa Park",
        specialty: "Dermatology",
        languages: ["English", "Korean"],
        availability: {
          monday: ["9:00 AM - 12:00 PM"],
          wednesday: ["9:00 AM - 12:00 PM", "1:00 PM - 4:00 PM"],
          friday: ["9:00 AM - 12:00 PM", "1:00 PM - 4:00 PM"]
        },
        newPatients: true,
        waitingList: true,
        consultationTime: 30
      }
    ];

    this.services = [
      {
        name: "General Check-up",
        duration: 30,
        price: "$150",
        description: "Comprehensive health examination including vital signs, physical exam, and health counseling"
      },
      {
        name: "Urgent Care",
        duration: 20,
        price: "$200",
        description: "Same-day appointments for non-emergency medical issues"
      },
      {
        name: "Vaccinations",
        duration: 15,
        price: "$50-$200",
        description: "All routine vaccinations including flu shots, COVID-19, and travel vaccines"
      },
      {
        name: "Lab Work",
        duration: 15,
        price: "Varies",
        description: "Blood tests, urinalysis, and other diagnostic tests"
      },
      {
        name: "Physical Therapy",
        duration: 45,
        price: "$120",
        description: "Rehabilitation services for injuries and chronic conditions"
      },
      {
        name: "Mental Health Counseling",
        duration: 50,
        price: "$180",
        description: "Individual therapy sessions with licensed counselors"
      }
    ];

    this.insurance = [
      "Blue Cross Blue Shield",
      "Aetna",
      "UnitedHealthcare",
      "Cigna",
      "Humana",
      "Medicare",
      "Medicaid",
      "Kaiser Permanente",
      "Anthem",
      "Molina Healthcare"
    ];

    this.appointmentTypes = [
      { type: "New Patient Visit", duration: 45, requiresInfo: ["insurance", "medical history", "medications"] },
      { type: "Follow-up Visit", duration: 30, requiresInfo: ["patient ID"] },
      { type: "Annual Physical", duration: 45, requiresInfo: ["insurance", "fasting required"] },
      { type: "Sick Visit", duration: 20, requiresInfo: ["symptoms"] },
      { type: "Vaccination", duration: 15, requiresInfo: ["vaccine type"] },
      { type: "Lab Work", duration: 15, requiresInfo: ["doctor's order", "fasting status"] },
      { type: "Specialist Consultation", duration: 45, requiresInfo: ["referral", "medical records"] }
    ];

    this.commonQuestions = {
      "parking": "We offer free parking in our building. The entrance is on 2nd Avenue. Handicapped parking is available near the main entrance.",
      "forms": "New patient forms are available on our website or you can arrive 15 minutes early to complete them.",
      "cancellation": "Please call us at least 24 hours in advance to cancel or reschedule to avoid a $50 cancellation fee.",
      "emergency": "For medical emergencies, please call 911 immediately. Our urgent care is available for non-emergency issues.",
      "prescription": "Prescription refills can be requested through our patient portal or by calling our pharmacy line at (206) 555-0102.",
      "test_results": "Test results are typically available within 2-3 business days. We'll call you if there are any concerns.",
      "payment": "We accept cash, check, and all major credit cards. Payment is due at the time of service.",
      "telemedicine": "We offer video consultations for established patients. Please call to schedule a virtual appointment."
    };

    this.sampleConversations = [
      {
        scenario: "New Patient Appointment",
        dialog: [
          { role: "patient", text: "Hi, I'd like to schedule an appointment with a doctor" },
          { role: "assistant", text: "I'd be happy to help you schedule an appointment. Are you a new patient or have you visited us before?" },
          { role: "patient", text: "I'm a new patient" },
          { role: "assistant", text: "Welcome to Azure Medical Center! For new patients, we'll need about 45 minutes for your first visit. What type of appointment do you need - a general check-up or are you experiencing specific health concerns?" },
          { role: "patient", text: "Just a general check-up" },
          { role: "assistant", text: "Perfect. We have several doctors available. Do you have a preference for a male or female doctor, or any specific language needs?" },
          { role: "patient", text: "A female doctor would be great" },
          { role: "assistant", text: "I can schedule you with Dr. Sarah Johnson, who specializes in Family Medicine, or Dr. Emily Rodriguez who specializes in Pediatrics but also sees adults. Both are excellent doctors. Do you have a preference?" }
        ]
      },
      {
        scenario: "Insurance Verification",
        dialog: [
          { role: "patient", text: "Do you accept Aetna insurance?" },
          { role: "assistant", text: "Yes, we do accept Aetna insurance. We'll need to verify your specific plan benefits when you come in. Please bring your insurance card to your appointment. Would you like to schedule an appointment?" }
        ]
      },
      {
        scenario: "Urgent Symptoms",
        dialog: [
          { role: "patient", text: "I've been having severe chest pain since this morning" },
          { role: "assistant", text: "I understand you're experiencing chest pain. For severe chest pain, I strongly recommend you call 911 or go to the nearest emergency room immediately. This could be a serious condition that needs immediate medical attention. Would you like me to help you contact emergency services?" }
        ]
      }
    ];
  }

  getSystemPromptContext() {
    return {
      clinicInfo: this.clinicInfo,
      doctors: this.doctors,
      services: this.services,
      insurance: this.insurance,
      appointmentTypes: this.appointmentTypes,
      commonQuestions: this.commonQuestions
    };
  }

  getDoctorBySpecialty(specialty) {
    return this.doctors.filter(doc => 
      doc.specialty.toLowerCase().includes(specialty.toLowerCase())
    );
  }

  getDoctorAvailability(doctorName, date) {
    const doctor = this.doctors.find(doc => 
      doc.name.toLowerCase().includes(doctorName.toLowerCase())
    );
    if (!doctor) return null;

    const dayOfWeek = date.toLocaleLowerCase();
    return doctor.availability[dayOfWeek] || [];
  }

  isInsuranceAccepted(insuranceName) {
    return this.insurance.some(ins => 
      ins.toLowerCase().includes(insuranceName.toLowerCase())
    );
  }

  getNextAvailableSlot(doctorName, preferredTime) {
    // Implementation for finding next available appointment slot
    // This would connect to a real scheduling system in production
    const doctor = this.doctors.find(doc => 
      doc.name.toLowerCase().includes(doctorName.toLowerCase())
    );
    
    if (!doctor) return null;
    
    // Mock implementation - return next business day at preferred time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return {
      doctor: doctor.name,
      date: tomorrow.toLocaleDateString(),
      time: preferredTime || "10:00 AM",
      duration: doctor.consultationTime
    };
  }
}

module.exports = MedicalKnowledgeBase;