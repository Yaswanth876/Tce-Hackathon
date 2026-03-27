// Multi-language support for Voice Bot
export type Language = 'en' | 'ta';

export interface Translations {
  // Welcome page
  welcome: {
    companyName: string;
    title: string;
    subtitle: string;
    description: string;
    gettingStarted: string;
    steps: {
      step1: string;
      step2: string;
      step3: string;
      step4: string;
    };
    features: {
      garbage: {
        icon: string;
        title: string;
        desc: string;
      };
      road: {
        icon: string;
        title: string;
        desc: string;
      };
      water: {
        icon: string;
        title: string;
        desc: string;
      };
    };
    footerText: string;
    startButtonText: string;
  };

  // Session
  session: {
    listening: string;
    connecting: string;
    sessionEnded: string;
    agentNotJoined: string;
    agentNotInitialized: string;
    mediaDeviceError: string;
    connectionError: string;
  };

  // Agent control
  controls: {
    startAudio: string;
    microphoneAccess: string;
  };

  // Image upload
  image: {
    uploadPrompt: string;
    uploadedMessage: string;
  };

  // Error messages
  errors: {
    microphoneError: string;
    connectionErrorTitle: string;
    sessionEndedTitle: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    welcome: {
      companyName: 'Aqro Intelligence',
      title: 'Aqro Intelligence',
      subtitle: 'Voice Bot for Madurai Citizens - Report Civic Complaints',
      description:
        'Help keep Madurai clean - Report complaints easily with AI-powered voice assistance',
      gettingStarted: 'Getting Started:',
      steps: {
        step1: 'Click the "Start call" button to begin your conversation',
        step2: 'Allow microphone access when prompted',
        step3: 'Report civic issues like garbage, potholes, or drainage problems',
        step4: 'Get instant confirmation and tracking for your complaints',
      },
      features: {
        garbage: {
          icon: '🚮',
          title: 'Garbage Collection',
          desc: 'Report uncollected garbage and waste management issues',
        },
        road: {
          icon: '🛣️',
          title: 'Road & Infrastructure',
          desc: 'Report potholes, streetlight issues, and road damage',
        },
        water: {
          icon: '💧',
          title: 'Water & Drainage',
          desc: 'Report water leakage, drainage blocks, and flooding',
        },
      },
      footerText: 'Powered by Aqro Intelligence • Helping Madurai Stay Clean',
      startButtonText: 'Start call',
    },
    session: {
      listening: 'Agent is listening, ask it a question',
      connecting: 'Connecting to agent...',
      sessionEnded: 'Session ended',
      agentNotJoined: 'Agent did not join the room. ',
      agentNotInitialized: 'Agent connected but did not complete initializing. ',
      mediaDeviceError: 'Encountered an error with your media devices',
      connectionError: 'There was an error connecting to the agent',
    },
    controls: {
      startAudio: 'Start Audio',
      microphoneAccess: 'Allow microphone access to use this feature',
    },
    image: {
      uploadPrompt:
        'I\'ve uploaded an image for analysis. Please examine this image and provide insights about what you see. Focus on identifying issues and recommending improvements.',
      uploadedMessage: 'Image uploaded for analysis',
    },
    errors: {
      microphoneError: 'Microphone Error',
      connectionErrorTitle: 'Connection Error',
      sessionEndedTitle: 'Session Ended',
    },
  },
  ta: {
    welcome: {
      companyName: 'அக்ரோ இன்டெலிஜென்ஸ்',
      title: 'அக்ரோ இன்டெலிஜென்ஸ்',
      subtitle: 'மதுரை குடிமக்களுக்கான வயிஸ் பாட் - நகர் புகார்களை தெரிவிக்கவும்',
      description:
        'மதுரையை சுத்தமாக வைக்க உதவுங்கள் - AI-இயக்கிய குரல் உதவியுடன் சுலபமாக புகார்களை தெரிவிக்கவும்',
      gettingStarted: 'தொடங்குதல்:',
      steps: {
        step1: '"அழைப்பு தொடங்கு" பொத்தனை கிளிக் செய்து உங்கள் உரையாடலைத் தொடங்குங்கள்',
        step2: 'கேட்டபடி மைக்ரோஃபோன் அணுகலை அனுமதிக்கவும்',
        step3: 'குப்பை, பாதைகளில் உள்ள குண்ணங்கள், அல்லது வடிகால் சிக்கல்கள் போன்ற நகர சிக்கல்களைத் தெரிவிக்கவும்',
        step4: 'உங்கள் புகார்களுக்கான உடனடி உறுதிப்பாடு மற்றும் ট்র็যாக்கிங் பெறுங்கள்',
      },
      features: {
        garbage: {
          icon: '🚮',
          title: 'குப்பை சংগ்रহம்',
          desc: 'சேகரிக்கப்படாத குப்பை மற்றும் கழிவு ব்যবস்தாபன சிக்கல்களை தெரிவிக்கவும்',
        },
        road: {
          icon: '🛣️',
          title: 'சாலை மற்றும் உள்கட்டமைப்பு',
          desc: 'பாதைகளில் உள்ள குண்ணங்கள், தெருவொளி சிக்கல்கள், மற்றும் சாலை சேதத்தை தெரிவிக்கவும்',
        },
        water: {
          icon: '💧',
          title: 'நீர் மற்றும் வடிகால்',
          desc: 'நீர் கசிவு, வடிகால் அடைப்பு, மற்றும் வெள்ளம் போன்ற சிக்கல்களைத் தெரிவிக்கவும்',
        },
      },
      footerText: 'அக்ரோ இன்டெலிஜென்ஸ் மூலம் இயக்கப்படுகிறது • மதுரையை சுத்தமாக வைக்க உதவுதல்',
      startButtonText: 'அழைப்பு தொடங்கு',
    },
    session: {
      listening: 'எஜெண்ட் கேட்கிறது, அதை ஒரு கேள்வி கேளுங்கள்',
      connecting: 'எஜெண்டுக்கு இணைக்கப்படுகிறது...',
      sessionEnded: 'அமர்வு முடிந்துவிட்டது',
      agentNotJoined: 'எஜெண்ட் அறைக்குள் நுழையவில்லை. ',
      agentNotInitialized: 'எஜெண்ட் இணைக்கப்பட்டாலும் ஆரம்ப செய்ய முடியவில்லை. ',
      mediaDeviceError: 'உங்கள் மீடியா சாதனங்களில் பிழை ஏற்பட்டது',
      connectionError: 'எஜெண்டுக்கு இணைக்க பிழை ஏற்பட்டது',
    },
    controls: {
      startAudio: 'ஆடியோவைத் தொடங்கு',
      microphoneAccess: 'இந்த அம்சத்தைப் பயன்படுத்த மைக்ரோஃபோன் அ்ணுகலை அனுமதிக்கவும்',
    },
    image: {
      uploadPrompt:
        'நான் ஒரு படத்தை பகுப்பாய்வுக்காக பதிவேற்றியுள்ளேன். இந்த படத்தை பரிசோதிக்கவும் மற்றும் நீங்கள் உள்ளவை பற்றிய பகுப்பாய்வு வழங்கவும். சமস்யைகளை கண்டறிய மற்றும் மேம்பாடுகளை பரிந்துரைக்கவும்.',
      uploadedMessage: 'பகுப்பாய்வுக்கான படத்தை பதிவேற்றியது',
    },
    errors: {
      microphoneError: 'மைக்ரோஃபோன் பிழை',
      connectionErrorTitle: 'இணைப்பு பிழை',
      sessionEndedTitle: 'அமர்வு முடிந்துவிட்டது',
    },
  },
};

export function getTranslation(language: Language): Translations {
  return translations[language];
}
