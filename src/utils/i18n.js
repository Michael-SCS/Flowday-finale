import { useMemo } from 'react';
import { useSettings } from './settingsContext';

const translations = {
  es: {
    // ======================
    // GLOBAL / SIMPLE
    // ======================
    chipList: 'Ver más',

    creativeHobbyOptions: [
      'Ilustración digital',
      'Escritura de cuentos cortos',
      'Bordado creativo',
      'Creación de velas artesanales',
      'Fotografía estética',
      'Producción musical básica',
      'Journaling creativo (diarios visuales)',
      'Macramé decorativo',
      'Repostería creativa',
      'Creación de contenido creativo (videos, reels)',
      'Otros',
    ],

    studySubjectOptions: [
      'Matemáticas',
      'Lenguaje / Español',
      'Inglés',
      'Ciencias',
      'Historia',
      'Geografía',
      'Filosofía',
      'Otros',
    ],

    // ======================
    // VITAMINS / MARKET (ROOT)
    // ======================
    vitamins: {
      question: '¿Qué vitamina tomaste?',
      placeholder: 'ej: Vitamina D',
      subtitlePrefix: '💊 Tomaste',
      addButton: 'Agregar vitaminas',
    },

    market: {
      addButton: 'Agregar productos',
      modalTitle: 'Agregar medicamento',
      nameLabel: 'Nombre del medicamento',
      namePlaceholder: 'Vitamina C, Omega 3...',
      qtyLabel: 'Cantidad',
      qtyPlaceholder: '1',
    },

    // ======================
    // TOUR / MASCOTA
    // ======================
    mascotTour: {
      welcomeTitle: 'Bienvenido a Fluu',
      welcomeText:
        'Hola, soy Fluffy. Te acompañaré en este recorrido rápido para que conozcas Fluu y empieces a crear hábitos a tu ritmo. Solo tomará unos segundos.',

      calendarMainTitle: 'Tu calendario',
      calendarMainText:
        'Aquí verás todo lo que has planeado: hábitos, tareas y cosas importantes para cada día. Yo te ayudo a mantenerlo todo en orden.',

      calendarPlusTitle: 'Agregar algo nuevo',
      calendarPlusText:
        'Toca el botón + que está abajo a la derecha y crea nuevos hábitos o actividades en segundos.',

      pomodoroTitle: 'Pomodoro',
      pomodoroText:
        'Aquí puedes concentrarte por sesiones y tomar descansos. Yo te acompaño cuando necesites enfocarte en algo importante.',

      profileTitle: 'Tu perfil',
      profileText:
        'Desde aquí puedes cambiar el color de la app, el idioma y tus datos. Siempre puedes volver si quieres ajustar algo.',

      skip: 'Saltar recorrido',
      next: 'Siguiente',
      start: 'Empezar',
    },

    // ======================
    // AUTH
    // ======================
    auth: {
      errorTitle: 'Error de inicio de sesión',
      errorInvalidCredentials: 'Correo o contraseña incorrectos',

      errorTitle: 'Login error',
      errorInvalidCredentials: 'Incorrect email or password',

      errorTitle: 'Erro de login',
      errorInvalidCredentials: 'E-mail ou senha incorretos',

      errorTitle: 'Erreur de connexion',
      errorInvalidCredentials: 'E-mail ou mot de passe incorrect',

      loginTitle: 'Iniciar sesión',
      emailFieldLabel: 'Correo electrónico',
      passwordFieldLabel: 'Contraseña',
      loginButton: 'Entrar',
      noAccountLink: '¿No tienes cuenta? Regístrate',
      emailLabel: 'Correo electrónico',
      passwordLabel: 'Contraseña',
    },

    // ======================
    // REGISTER
    // ======================
    register: {
      title: 'Crear cuenta',
      subtitle: 'Regístrate para comenzar a usar la app',
      policyAcceptPrefix: 'Acepto la ',
      policyAcceptLink: 'política de privacidad',
      submit: 'Registrarse',
      goToLogin: '¿Ya tienes cuenta? Iniciar sesión',
      step1Helper:
        'Crea una cuenta para guardar tus hábitos en la nube y acceder desde cualquier dispositivo.',
      finish: 'Finalizar registro',
    },

    // ======================
    // SETTINGS
    // ======================
    settings: {
      quickSectionTitle: 'Ajustes rápidos',
    },

    // ======================
    // PROFILE
    // ======================
    profile: {
      languageEs: 'Español',
      languageEn: 'Inglés',
      languagePt: 'Portugués',
      languageFr: 'Francés',

      loading: 'Cargando perfil...',

      personalSettingsTitle: 'Ajustes personales',
      personalSettingsSubtitle: 'Gestiona tus ajustes personales',

      save: 'Guardar',
      settingsModalTitle: 'Configuración',
      settingModalTitle: 'Configuración',
      email: 'Correo electrónico',

      privacyIntro:
        'Tu privacidad es importante para nosotros. Lee cómo protegemos y usamos tus datos.',
      privacyUseOfDataTitle: 'Uso de datos',
      privacyUseOfDataText:
        'Utilizamos tus datos solo para mejorar tu experiencia en la app.',
      privacyUseOfDataBullet1: 'Nunca vendemos tu información.',
      privacyUseOfDataBullet2:
        'Tus datos se usan solo para funciones esenciales.',
      privacyUseOfDataBullet3:
        'Puedes solicitar la eliminación de tus datos en cualquier momento.',
      privacySharingTitle: 'Compartir información',
      privacySharingText:
        'No compartimos tu información personal con terceros sin tu consentimiento.',
      privacyLiabilityTitle: 'Limitación de responsabilidad',
      privacyLiabilityText:
        'No somos responsables por el mal uso de la app o por acciones de terceros.',
      privacyNotAdviceTitle: 'No es consejo médico',
      privacyNotAdviceText:
        'La información proporcionada no sustituye el consejo de un profesional de la salud.',
      privacyRightsTitle: 'Tus derechos',
      privacyRightsText:
        'Puedes acceder, corregir o eliminar tus datos personales.',
      privacyMinorsTitle: 'Menores de edad',
      privacyMinorsText:
        'La app no está dirigida a menores de 13 años.',
      privacyChangesTitle: 'Cambios en la política',
      privacyChangesText:
        'Te notificaremos sobre cambios importantes en esta política.',
      privacyAcceptanceText:
        'Al usar la app, aceptas nuestra política de privacidad.',
      policyAccept: 'Aceptar política de privacidad',

      accountTitle: 'Cuenta',
      accountSubtitle: 'Gestiona tu cuenta y privacidad',

      feedbackTitle: 'Enviar feedback',
      feedbackOpen: 'Abrir formulario',

      privacyPolicy: 'Política de privacidad',
      privacyOpenHint: 'Ver detalles de privacidad',

      deleteAccount: 'Eliminar cuenta',
      deleteAccountMessageShort: 'Esta acción es permanente',

      moreSettingsButton: 'Más ajustes',

      appearanceMode: 'Modo',
      appearanceDark: 'Oscuro',
      appearanceLight: 'Claro',

      notificationsTitle: 'Notificaciones',
      notificationsOn: 'Activadas',
      notificationsOff: 'Desactivadas',

      appLanguage: 'Idioma',

      timeFormatTitle: 'Formato de hora',
      timeFormat12h: '12h',
      timeFormat24h: '24h',
      timeFormatSystem: 'Sistema',

      personalinfo: 'Perfil',
      personalInfo: 'Perfil',

      colorBlue: 'Azul',
      colorPink: 'Rosa',
      colorGreen: 'Verde',
      colorPurple: 'Morado',
      colorOrange: 'Naranja',

      firstName: 'Nombre',
      lastName: 'Apellido',
      age: 'Edad',
      gender: 'Género',

      genderOptions: {
        male: 'Masculino',
        female: 'Femenino',
        nonBinary: 'No binario',
        genderFluid: 'Género fluido',
        preferNotSay: 'Prefiero no decirlo',
        other: 'Otro',
      },
    },

    // ======================
    // MOOD
    // ======================
    mood: {
      chartTitle: 'Gráfico de estado de ánimo',
      chartSubtitle: 'Tu estado de ánimo a lo largo del tiempo',
      todayLabel: 'Hoy',
      checkInTitle: 'Registrar estado de ánimo',
      checkInSubtitle: '¿Cómo te sientes hoy?',
      checkInFooter:
        'Puedes agregar una nota sobre cómo te sientes.',
    },

    // ======================
    // CALENDAR
    // ======================
    calendar: {
      marketDefaultSectionTitle: 'Lista de compras',
      marketDefaultSectionTitle: 'Compras',
      checklistDefaultSectionTitle: 'Lista de tareas',

      accept: 'Aceptar',
      total: 'Total',

      emptyTitle: 'No hay eventos',
      emptySubtitle:
        'Aún no tienes hábitos ni actividades para este día.',

      title: 'Calendario',

      savingsHalfway: '¡Vas a mitad de tu meta de ahorro!',
      addSavings: 'Agregar ahorro',
      addSavingsPlaceholder: 'Ej: 100',
      saveSavings: 'Guardar ahorro',

      endHabitConfirm: 'Finalizar hábito',

      vitaminsDefaultSectionTitle: 'Vitaminas',
      progressLabel: 'Progreso',

      addWater: 'Agregar agua',
      addWaterPlaceholder: 'Ej: 250',
      saveWater: 'Guardar agua',
      waterStartGlass: '¡Toma tu primer vaso de agua!',
      waterDoingGreat: '¡Vas muy bien, sigue así!',
      waterGoodStart: '¡Buen comienzo!',

      todayButton: 'Hoy',
      edit: 'Editar',
      delete: 'Eliminar',

      selectHabitTitle: 'Selecciona un hábito',

      deleteOnlyThis: 'Eliminar solo esta',
      deleteThisAndNext: 'Eliminar esta y las siguientes',
      cancel: 'Cancelar',

      deleteActivityTitle: '¿Qué deseas eliminar?',
      deleteActivityMessage:
        '¿Quieres eliminar solo esta actividad o esta y todas las siguientes?',
    },

    // ======================
    // POMODORO
    // ======================
    pomodoro: {
      title: 'Pomodoro',
      workLabel: 'Trabajo',
      sessions: 'Sesiones',
      preparing: 'Preparando',

      stop: 'Detener',
      start: 'Iniciar',

      breakLabel: 'Descanso',
      longBreakLabel: 'Descanso largo',

      startButton: 'Iniciar',
      stopButton: 'Detener',
      resetButton: 'Reiniciar',

      completedMessage:
        '¡Pomodoro completado! ¡Buen trabajo!',

      settingsTitle: 'Configuración de Pomodoro',
      quickSettings: 'Ajustes rápidos',
      presetCustom: 'Personalizado',
      workMinutes: 'Trabajo (min)',
      restMinutes: 'Descanso (min)',
      total: 'Total de sesiones',
      saveConfig: 'Guardar',
    },

    // ======================
    // HABIT FORM
    // ======================
    habitForm: {
      savingsSavedLabel: 'Ahorro guardado',
      savingsSavedHelp:
        'Registra cuánto dinero lograste ahorrar hoy.',
      savingsSavedPlaceholder: 'Ejemplo: 50',
      endLabel: 'Fin',

      marketPricePlaceholder: '$',
      colorLabel: 'Color',
      periodLabel: 'Período',
      startLabel: 'Inicio',

      hasEndDateQuestion:
        '¿Este hábito tiene una fecha de fin?',

      waterTargetLabel:
        '¿Cuánta agua tomarás al día? (ml)',
      waterTargetInfo:
        'La meta recomendada es 2000ml (8 vasos).',

      frequencyOnce: 'Una vez',
      frequencyDaily: 'Diario',
      frequencyWeekly: 'Semanal',
      frequencyMonthly: 'Mensual',
      frequencyYearly: 'Anual',

      saveButton: 'Guardar',

      timeLabel: 'Hora',
      iconLabel: 'Ícono',
      emojiLabel: 'Emoji',
      descriptionLabel: 'Descripción',
      notesLabel: 'Notas',
      reminderLabel: 'Recordatorio',
      goalLabel: 'Meta',
      unitLabel: 'Unidad',
      amountLabel: 'Cantidad',
      categoryLabel: 'Categoría',
      typeLabel: 'Tipo',
    },

    // ======================
    // SPECIAL HABITS
    // ======================
    specialHabits: {
      call: {
        question: '¿A quién llamarás hoy?',
      },

      savingsSavedLabel: 'Ahorro guardado',
      savingsSavedHelp:
        'Registra cuánto dinero lograste ahorrar hoy.',
      savingsSavedPlaceHolder: 'Ej: 50',

      birthday: {
        question: '¿De quién es el cumpleaños?',
        placeholder: 'Nombre',
        subtitlePrefix: '🎂 Hoy es',
      },

      vitamins: {
        question: '¿Qué vitamina tomaste?',
        placeholder: 'ej: Vitamina D',
        subtitlePrefix: '💊 Tomaste',
        addButton: 'Agregar vitaminas',
      },

      mood: {
        question: '¿Cómo te sientes hoy?',
        placeholder: 'ej: Feliz',
        subtitlePrefix: '😊 Estado de ánimo:',
      },

      pomodoro: {
        question: '¿En qué te vas a enfocar?',
        placeholder: 'ej: Estudio',
        subtitlePrefix: '🍅 Pomodoro:',
      },

      water: {
        question: '¿Cuánta agua bebiste?',
        placeholder: 'ej: 250ml',
        subtitlePrefix: '💧 Consumo de agua:',
      },

      savings: {
        question: '¿Cuánto dinero quieres ahorrar?',
        placeholder: 'Ejemplo: 100',
        subtitlePrefix:
          '💰 Hoy tu meta de ahorro es',
      },

      mood: {
        chartTitle: 'Gráfico de estado de ánimo',
        checkInButton: 'Registrar',
        todayLabel: 'Hoy',
        addNotePlaceholder: 'Agregar una nota...',
      },

      book: {
        question: '¿Qué libro deseas leer?',
        placeholder: 'Título del libro',
        subtitlePrefix: '📚 Estás leyendo',
      },

      market: {
        addButton: 'Agregar productos',
      },
    },
  },
  en: {
    // ======================
    // GLOBAL / SIMPLE
    // ======================
    chipList: 'See more',

    creativeHobbyOptions: [
      'Digital illustration',
      'Short story writing',
      'Creative embroidery',
      'Handmade candle making',
      'Aesthetic photography',
      'Basic music production',
      'Creative journaling (visual diaries)',
      'Decorative macramé',
      'Creative baking',
      'Creative content creation (videos, reels)',
      'Others',
    ],

    studySubjectOptions: [
      'Mathematics',
      'Language / Spanish',
      'English',
      'Science',
      'History',
      'Geography',
      'Philosophy',
      'Others',
    ],

    // ======================
    // VITAMINS / MARKET (ROOT)
    // ======================
    vitamins: {
      question: 'Which vitamin did you take?',
      placeholder: 'e.g. Vitamin D',
      subtitlePrefix: '💊 You took',
      addButton: 'Add vitamins',
    },

    market: {
      addButton: 'Add products',
      modalTitle: 'Add medication',
      nameLabel: 'Medication name',
      namePlaceholder: 'Vitamin C, Omega 3...',
      qtyLabel: 'Quantity',
      qtyPlaceholder: '1',
    },

    // ======================
    // TOUR / MASCOT
    // ======================
    mascotTour: {
      welcomeTitle: 'Welcome to Fluu',
      welcomeText:
        'Hi, I’m Fluffy. I’ll guide you through this quick tour so you can get to know Fluu and start building habits at your own pace. It will only take a few seconds.',

      calendarMainTitle: 'Your calendar',
      calendarMainText:
        'Here you’ll see everything you’ve planned: habits, tasks, and important things for each day. I help you keep it all organized.',

      calendarPlusTitle: 'Add something new',
      calendarPlusText:
        'Tap the + button at the bottom right and create new habits or activities in seconds.',

      pomodoroTitle: 'Pomodoro',
      pomodoroText:
        'Here you can focus in sessions and take breaks. I’ll be with you whenever you need to concentrate.',

      profileTitle: 'Your profile',
      profileText:
        'From here you can change the app color, language, and your personal data. You can always come back to adjust things.',

      skip: 'Skip tour',
      next: 'Next',
      start: 'Start',
    },

    // ======================
    // AUTH
    // ======================
    auth: {
      errorTitle: 'Login error',
      errorInvalidCredentials: 'Incorrect email or password',

      errorTitle: 'Login error',
      errorInvalidCredentials: 'Incorrect email or password',

      errorTitle: 'Login error',
      errorInvalidCredentials: 'Incorrect email or password',

      errorTitle: 'Login error',
      errorInvalidCredentials: 'Incorrect email or password',

      loginTitle: 'Sign in',
      emailFieldLabel: 'Email',
      passwordFieldLabel: 'Password',
      loginButton: 'Sign in',
      noAccountLink: "Don't have an account? Sign up",
      emailLabel: 'Email',
      passwordLabel: 'Password',
    },

    // ======================
    // REGISTER
    // ======================
    register: {
      title: 'Create account',
      subtitle: 'Sign up to start using the app',
      policyAcceptPrefix: 'I accept the ',
      policyAcceptLink: 'privacy policy',
      submit: 'Sign up',
      goToLogin: 'Already have an account? Sign in',
      step1Helper:
        'Create an account to save your habits in the cloud and access them from any device.',
      finish: 'Finish registration',
    },

    // ======================
    // SETTINGS
    // ======================
    settings: {
      quickSectionTitle: 'Quick settings',
    },

    // ======================
    // PROFILE
    // ======================
    profile: {
      languageEs: 'Spanish',
      languageEn: 'English',
      languagePt: 'Portuguese',
      languageFr: 'French',

      loading: 'Loading profile...',

      personalSettingsTitle: 'Personal settings',
      personalSettingsSubtitle: 'Manage your personal settings',

      save: 'Save',
      settingsModalTitle: 'Settings',
      settingModalTitle: 'Settings',
      email: 'Email',

      privacyIntro:
        'Your privacy is important to us. Learn how we protect and use your data.',
      privacyUseOfDataTitle: 'Data usage',
      privacyUseOfDataText:
        'We use your data only to improve your experience in the app.',
      privacyUseOfDataBullet1: 'We never sell your information.',
      privacyUseOfDataBullet2:
        'Your data is used only for essential features.',
      privacyUseOfDataBullet3:
        'You can request deletion of your data at any time.',
      privacySharingTitle: 'Information sharing',
      privacySharingText:
        'We do not share your personal information with third parties without your consent.',
      privacyLiabilityTitle: 'Limitation of liability',
      privacyLiabilityText:
        'We are not responsible for misuse of the app or actions by third parties.',
      privacyNotAdviceTitle: 'Not medical advice',
      privacyNotAdviceText:
        'The information provided does not replace advice from a healthcare professional.',
      privacyRightsTitle: 'Your rights',
      privacyRightsText:
        'You can access, correct, or delete your personal data.',
      privacyMinorsTitle: 'Minors',
      privacyMinorsText:
        'The app is not intended for children under 13 years old.',
      privacyChangesTitle: 'Policy changes',
      privacyChangesText:
        'We will notify you about important changes to this policy.',
      privacyAcceptanceText:
        'By using the app, you accept our privacy policy.',
      policyAccept: 'Accept privacy policy',

      accountTitle: 'Account',
      accountSubtitle: 'Manage your account and privacy',

      feedbackTitle: 'Send feedback',
      feedbackOpen: 'Open form',

      privacyPolicy: 'Privacy policy',
      privacyOpenHint: 'View privacy details',

      deleteAccount: 'Delete account',
      deleteAccountMessageShort: 'This action is permanent',

      moreSettingsButton: 'More settings',

      appearanceMode: 'Mode',
      appearanceDark: 'Dark',
      appearanceLight: 'Light',

      notificationsTitle: 'Notifications',
      notificationsOn: 'Enabled',
      notificationsOff: 'Disabled',

      appLanguage: 'Language',

      timeFormatTitle: 'Time format',
      timeFormat12h: '12h',
      timeFormat24h: '24h',
      timeFormatSystem: 'System',

      personalinfo: 'Profile',
      personalInfo: 'Profile',

      colorBlue: 'Blue',
      colorPink: 'Pink',
      colorGreen: 'Green',
      colorPurple: 'Purple',
      colorOrange: 'Orange',

      firstName: 'First name',
      lastName: 'Last name',
      age: 'Age',
      gender: 'Gender',

      genderOptions: {
        male: 'Male',
        female: 'Female',
        nonBinary: 'Non-binary',
        genderFluid: 'Gender fluid',
        preferNotSay: 'Prefer not to say',
        other: 'Other',
      },
    },

    // ======================
    // MOOD
    // ======================
    mood: {
      chartTitle: 'Mood chart',
      chartSubtitle: 'Your mood over time',
      todayLabel: 'Today',
      checkInTitle: 'Log mood',
      checkInSubtitle: 'How are you feeling today?',
      checkInFooter:
        'You can add a note about how you feel.',
    },

    // ======================
    // CALENDAR
    // ======================
    calendar: {
      marketDefaultSectionTitle: 'Shopping list',
      marketDefaultSectionTitle: 'Shopping',
      checklistDefaultSectionTitle: 'Task list',

      accept: 'Accept',
      total: 'Total',

      emptyTitle: 'No events',
      emptySubtitle:
        "You don't have any habits or activities for this day yet.",

      title: 'Calendar',

      savingsHalfway: 'You are halfway to your savings goal!',
      addSavings: 'Add savings',
      addSavingsPlaceholder: 'e.g. 100',
      saveSavings: 'Save savings',

      endHabitConfirm: 'Finish habit',

      vitaminsDefaultSectionTitle: 'Vitamins',
      progressLabel: 'Progress',

      addWater: 'Add water',
      addWaterPlaceholder: 'e.g. 250',
      saveWater: 'Save water',
      waterStartGlass: 'Take your first glass of water!',
      waterDoingGreat: 'You’re doing great, keep it up!',
      waterGoodStart: 'Good start!',

      todayButton: 'Today',
      edit: 'Edit',
      delete: 'Delete',

      selectHabitTitle: 'Select a habit',

      deleteOnlyThis: 'Delete only this',
      deleteThisAndNext: 'Delete this and the following',
      cancel: 'Cancel',

      deleteActivityTitle: 'What do you want to delete?',
      deleteActivityMessage:
        'Do you want to delete only this activity or this and all following ones?',
    },

    // ======================
    // POMODORO
    // ======================
    pomodoro: {
      title: 'Pomodoro',
      workLabel: 'Work',
      sessions: 'Sessions',
      preparing: 'Preparing',

      stop: 'Stop',
      start: 'Start',

      breakLabel: 'Break',
      longBreakLabel: 'Long break',

      startButton: 'Start',
      stopButton: 'Stop',
      resetButton: 'Reset',

      completedMessage:
        'Pomodoro completed! Great job!',

      settingsTitle: 'Pomodoro settings',
      quickSettings: 'Quick settings',
      presetCustom: 'Custom',
      workMinutes: 'Work (min)',
      restMinutes: 'Break (min)',
      total: 'Total sessions',
      saveConfig: 'Save',
    },

    // ======================
    // HABIT FORM
    // ======================
    habitForm: {
      savingsSavedLabel: 'Saved amount',
      savingsSavedHelp:
        'Record how much money you managed to save today.',
      savingsSavedPlaceholder: 'Example: 50',

      endLabel: 'End',
      endLabel: 'End',
      endLabel: 'End',
      endLabel: 'End',

      marketPricePlaceholder: '$',
      colorLabel: 'Color',
      periodLabel: 'Period',
      startLabel: 'Start',

      hasEndDateQuestion:
        'Does this habit have an end date?',

      waterTargetLabel:
        'How much water will you drink per day? (ml)',
      waterTargetInfo:
        'The recommended goal is 2000ml (8 glasses).',

      frequencyOnce: 'Once',
      frequencyDaily: 'Daily',
      frequencyWeekly: 'Weekly',
      frequencyMonthly: 'Monthly',
      frequencyYearly: 'Yearly',

      saveButton: 'Save',

      timeLabel: 'Time',
      iconLabel: 'Icon',
      emojiLabel: 'Emoji',
      descriptionLabel: 'Description',
      notesLabel: 'Notes',
      reminderLabel: 'Reminder',
      goalLabel: 'Goal',
      unitLabel: 'Unit',
      amountLabel: 'Amount',
      categoryLabel: 'Category',
      typeLabel: 'Type',
    },

    // ======================
    // SPECIAL HABITS
    // ======================
    specialHabits: {
      call: {
        question: 'Who will you call today?',
      },

      savingsSavedLabel: 'Saved amount',
      savingsSavedHelp:
        'Record how much money you managed to save today.',
      savingsSavedPlaceHolder: 'e.g. 50',

      birthday: {
        question: "Whose birthday is it?",
        placeholder: 'Name',
        subtitlePrefix: '🎂 Today is',
      },

      vitamins: {
        question: 'Which vitamin did you take?',
        placeholder: 'e.g. Vitamin D',
        subtitlePrefix: '💊 You took',
        addButton: 'Add vitamins',
      },

      mood: {
        question: 'How are you feeling today?',
        placeholder: 'e.g. Happy',
        subtitlePrefix: '😊 Mood:',
      },

      pomodoro: {
        question: 'What will you focus on?',
        placeholder: 'e.g. Study',
        subtitlePrefix: '🍅 Pomodoro:',
      },

      water: {
        question: 'How much water did you drink?',
        placeholder: 'e.g. 250ml',
        subtitlePrefix: '💧 Water intake:',
      },

      savings: {
        question: 'How much money do you want to save?',
        placeholder: 'Example: 100',
        subtitlePrefix:
          '💰 Today your savings goal is',
      },

      mood: {
        chartTitle: 'Mood chart',
        checkInButton: 'Log',
        todayLabel: 'Today',
        addNotePlaceholder: 'Add a note...',
      },

      book: {
        question: 'Which book do you want to read?',
        placeholder: 'Book title',
        subtitlePrefix: '📚 You are reading',
      },

      market: {
        addButton: 'Add products',
      },
    },
  },
  pt: {
    // ======================
    // GLOBAL / SIMPLE
    // ======================
    chipList: 'Ver mais',

    creativeHobbyOptions: [
      'Ilustração digital',
      'Escrita de contos curtos',
      'Bordado criativo',
      'Criação de velas artesanais',
      'Fotografia estética',
      'Produção musical básica',
      'Journaling criativo (diários visuais)',
      'Macramê decorativo',
      'Confeitaria criativa',
      'Criação de conteúdo criativo (vídeos, reels)',
      'Outros',
    ],

    studySubjectOptions: [
      'Matemática',
      'Linguagem / Espanhol',
      'Inglês',
      'Ciências',
      'História',
      'Geografia',
      'Filosofia',
      'Outros',
    ],

    // ======================
    // VITAMINS / MARKET (ROOT)
    // ======================
    vitamins: {
      question: 'Qual vitamina você tomou?',
      placeholder: 'ex: Vitamina D',
      subtitlePrefix: '💊 Você tomou',
      addButton: 'Adicionar vitaminas',
    },

    market: {
      addButton: 'Adicionar produtos',
      modalTitle: 'Adicionar medicamento',
      nameLabel: 'Nome do medicamento',
      namePlaceholder: 'Vitamina C, Ômega 3...',
      qtyLabel: 'Quantidade',
      qtyPlaceholder: '1',
    },

    // ======================
    // TOUR / MASCOT
    // ======================
    mascotTour: {
      welcomeTitle: 'Bem-vindo ao Fluu',
      welcomeText:
        'Oi, eu sou o Fluffy. Vou te acompanhar neste tour rápido para você conhecer o Fluu e começar a criar hábitos no seu ritmo. Leva só alguns segundos.',

      calendarMainTitle: 'Seu calendário',
      calendarMainText:
        'Aqui você verá tudo o que planejou: hábitos, tarefas e coisas importantes para cada dia. Eu te ajudo a manter tudo em ordem.',

      calendarPlusTitle: 'Adicionar algo novo',
      calendarPlusText:
        'Toque no botão + no canto inferior direito e crie novos hábitos ou atividades em segundos.',

      pomodoroTitle: 'Pomodoro',
      pomodoroText:
        'Aqui você pode se concentrar em sessões e fazer pausas. Eu fico com você quando precisar focar.',

      profileTitle: 'Seu perfil',
      profileText:
        'Aqui você pode mudar a cor do app, o idioma e seus dados. Sempre pode voltar para ajustar algo.',

      skip: 'Pular tour',
      next: 'Próximo',
      start: 'Começar',
    },

    // ======================
    // AUTH
    // ======================
    auth: {
      errorTitle: 'Erro de login',
      errorInvalidCredentials: 'E-mail ou senha incorretos',

      errorTitle: 'Erro de login',
      errorInvalidCredentials: 'E-mail ou senha incorretos',

      errorTitle: 'Erro de login',
      errorInvalidCredentials: 'E-mail ou senha incorretos',

      errorTitle: 'Erro de login',
      errorInvalidCredentials: 'E-mail ou senha incorretos',

      loginTitle: 'Entrar',
      emailFieldLabel: 'E-mail',
      passwordFieldLabel: 'Senha',
      loginButton: 'Entrar',
      noAccountLink: 'Não tem uma conta? Cadastre-se',
      emailLabel: 'E-mail',
      passwordLabel: 'Senha',
    },

    // ======================
    // REGISTER
    // ======================
    register: {
      title: 'Criar conta',
      subtitle: 'Cadastre-se para começar a usar o app',
      policyAcceptPrefix: 'Aceito a ',
      policyAcceptLink: 'política de privacidade',
      submit: 'Cadastrar',
      goToLogin: 'Já tem uma conta? Entrar',
      step1Helper:
        'Crie uma conta para salvar seus hábitos na nuvem e acessar de qualquer dispositivo.',
      finish: 'Finalizar cadastro',
    },

    // ======================
    // SETTINGS
    // ======================
    settings: {
      quickSectionTitle: 'Ajustes rápidos',
    },

    // ======================
    // PROFILE
    // ======================
    profile: {
      languageEs: 'Espanhol',
      languageEn: 'Inglês',
      languagePt: 'Português',
      languageFr: 'Francês',

      loading: 'Carregando perfil...',

      personalSettingsTitle: 'Ajustes pessoais',
      personalSettingsSubtitle: 'Gerencie seus ajustes pessoais',

      save: 'Salvar',
      settingsModalTitle: 'Configurações',
      settingModalTitle: 'Configurações',
      email: 'E-mail',

      privacyIntro:
        'Sua privacidade é importante para nós. Veja como protegemos e usamos seus dados.',
      privacyUseOfDataTitle: 'Uso de dados',
      privacyUseOfDataText:
        'Usamos seus dados apenas para melhorar sua experiência no app.',
      privacyUseOfDataBullet1: 'Nunca vendemos suas informações.',
      privacyUseOfDataBullet2:
        'Seus dados são usados apenas para funções essenciais.',
      privacyUseOfDataBullet3:
        'Você pode solicitar a exclusão dos seus dados a qualquer momento.',
      privacySharingTitle: 'Compartilhamento de informações',
      privacySharingText:
        'Não compartilhamos suas informações pessoais com terceiros sem seu consentimento.',
      privacyLiabilityTitle: 'Limitação de responsabilidade',
      privacyLiabilityText:
        'Não nos responsabilizamos pelo uso indevido do app ou ações de terceiros.',
      privacyNotAdviceTitle: 'Não é aconselhamento médico',
      privacyNotAdviceText:
        'As informações fornecidas não substituem a orientação de um profissional de saúde.',
      privacyRightsTitle: 'Seus direitos',
      privacyRightsText:
        'Você pode acessar, corrigir ou excluir seus dados pessoais.',
      privacyMinorsTitle: 'Menores de idade',
      privacyMinorsText:
        'O app não é destinado a menores de 13 anos.',
      privacyChangesTitle: 'Alterações na política',
      privacyChangesText:
        'Notificaremos você sobre mudanças importantes nesta política.',
      privacyAcceptanceText:
        'Ao usar o app, você aceita nossa política de privacidade.',
      policyAccept: 'Aceitar política de privacidade',

      accountTitle: 'Conta',
      accountSubtitle: 'Gerencie sua conta e privacidade',

      feedbackTitle: 'Enviar feedback',
      feedbackOpen: 'Abrir formulário',

      privacyPolicy: 'Política de privacidade',
      privacyOpenHint: 'Ver detalhes de privacidade',

      deleteAccount: 'Excluir conta',
      deleteAccountMessageShort: 'Esta ação é permanente',

      moreSettingsButton: 'Mais ajustes',

      appearanceMode: 'Modo',
      appearanceDark: 'Escuro',
      appearanceLight: 'Claro',

      notificationsTitle: 'Notificações',
      notificationsOn: 'Ativadas',
      notificationsOff: 'Desativadas',

      appLanguage: 'Idioma',

      timeFormatTitle: 'Formato de hora',
      timeFormat12h: '12h',
      timeFormat24h: '24h',
      timeFormatSystem: 'Sistema',

      personalinfo: 'Perfil',
      personalInfo: 'Perfil',

      colorBlue: 'Azul',
      colorPink: 'Rosa',
      colorGreen: 'Verde',
      colorPurple: 'Roxo',
      colorOrange: 'Laranja',

      firstName: 'Nome',
      lastName: 'Sobrenome',
      age: 'Idade',
      gender: 'Gênero',

      genderOptions: {
        male: 'Masculino',
        female: 'Feminino',
        nonBinary: 'Não binário',
        genderFluid: 'Gênero fluido',
        preferNotSay: 'Prefiro não dizer',
        other: 'Outro',
      },
    },

    // ======================
    // MOOD
    // ======================
    mood: {
      chartTitle: 'Gráfico de humor',
      chartSubtitle: 'Seu humor ao longo do tempo',
      todayLabel: 'Hoje',
      checkInTitle: 'Registrar humor',
      checkInSubtitle: 'Como você está se sentindo hoje?',
      checkInFooter:
        'Você pode adicionar uma nota sobre como se sente.',
    },

    // ======================
    // CALENDAR
    // ======================
    calendar: {
      marketDefaultSectionTitle: 'Lista de compras',
      marketDefaultSectionTitle: 'Compras',
      checklistDefaultSectionTitle: 'Lista de tarefas',

      accept: 'Aceitar',
      total: 'Total',

      emptyTitle: 'Sem eventos',
      emptySubtitle:
        'Você ainda não tem hábitos ou atividades para este dia.',

      title: 'Calendário',

      savingsHalfway: 'Você está na metade da sua meta de economia!',
      addSavings: 'Adicionar economia',
      addSavingsPlaceholder: 'ex: 100',
      saveSavings: 'Salvar economia',

      endHabitConfirm: 'Finalizar hábito',

      vitaminsDefaultSectionTitle: 'Vitaminas',
      progressLabel: 'Progresso',

      addWater: 'Adicionar água',
      addWaterPlaceholder: 'ex: 250',
      saveWater: 'Salvar água',
      waterStartGlass: 'Beba seu primeiro copo de água!',
      waterDoingGreat: 'Você está indo muito bem, continue!',
      waterGoodStart: 'Bom começo!',

      todayButton: 'Hoje',
      edit: 'Editar',
      delete: 'Excluir',

      selectHabitTitle: 'Selecione um hábito',

      deleteOnlyThis: 'Excluir apenas este',
      deleteThisAndNext: 'Excluir este e os próximos',
      cancel: 'Cancelar',

      deleteActivityTitle: 'O que você deseja excluir?',
      deleteActivityMessage:
        'Deseja excluir apenas esta atividade ou esta e todas as seguintes?',
    },

    // ======================
    // POMODORO
    // ======================
    pomodoro: {
      title: 'Pomodoro',
      workLabel: 'Trabalho',
      sessions: 'Sessões',
      preparing: 'Preparando',

      stop: 'Parar',
      start: 'Iniciar',

      breakLabel: 'Pausa',
      longBreakLabel: 'Pausa longa',

      startButton: 'Iniciar',
      stopButton: 'Parar',
      resetButton: 'Reiniciar',

      completedMessage:
        'Pomodoro concluído! Bom trabalho!',

      settingsTitle: 'Configurações do Pomodoro',
      quickSettings: 'Ajustes rápidos',
      presetCustom: 'Personalizado',
      workMinutes: 'Trabalho (min)',
      restMinutes: 'Pausa (min)',
      total: 'Total de sessões',
      saveConfig: 'Salvar',
    },

    // ======================
    // HABIT FORM
    // ======================
    habitForm: {
      savingsSavedLabel: 'Economia registrada',
      savingsSavedHelp:
        'Registre quanto dinheiro você conseguiu economizar hoje.',
      savingsSavedPlaceholder: 'Exemplo: 50',

      endLabel: 'Fim',
      endLabel: 'End',
      endLabel: 'Fim',
      endLabel: 'Fim',

      marketPricePlaceholder: '$',
      colorLabel: 'Cor',
      periodLabel: 'Período',
      startLabel: 'Início',

      hasEndDateQuestion:
        'Este hábito tem uma data de término?',

      waterTargetLabel:
        'Quanto de água você vai beber por dia? (ml)',
      waterTargetInfo:
        'A meta recomendada é 2000ml (8 copos).',

      frequencyOnce: 'Uma vez',
      frequencyDaily: 'Diário',
      frequencyWeekly: 'Semanal',
      frequencyMonthly: 'Mensal',
      frequencyYearly: 'Anual',

      saveButton: 'Salvar',

      timeLabel: 'Hora',
      iconLabel: 'Ícone',
      emojiLabel: 'Emoji',
      descriptionLabel: 'Descrição',
      notesLabel: 'Notas',
      reminderLabel: 'Lembrete',
      goalLabel: 'Meta',
      unitLabel: 'Unidade',
      amountLabel: 'Quantidade',
      categoryLabel: 'Categoria',
      typeLabel: 'Tipo',
    },

    // ======================
    // SPECIAL HABITS
    // ======================
    specialHabits: {
      call: {
        question: 'Para quem você vai ligar hoje?',
      },

      savingsSavedLabel: 'Economia registrada',
      savingsSavedHelp:
        'Registre quanto dinheiro você conseguiu economizar hoje.',
      savingsSavedPlaceHolder: 'ex: 50',

      birthday: {
        question: 'De quem é o aniversário?',
        placeholder: 'Nome',
        subtitlePrefix: '🎂 Hoje é',
      },

      vitamins: {
        question: 'Qual vitamina você tomou?',
        placeholder: 'ex: Vitamina D',
        subtitlePrefix: '💊 Você tomou',
        addButton: 'Adicionar vitaminas',
      },

      mood: {
        question: 'Como você está se sentindo hoje?',
        placeholder: 'ex: Feliz',
        subtitlePrefix: '😊 Humor:',
      },

      pomodoro: {
        question: 'Em que você vai focar?',
        placeholder: 'ex: Estudo',
        subtitlePrefix: '🍅 Pomodoro:',
      },

      water: {
        question: 'Quanta água você bebeu?',
        placeholder: 'ex: 250ml',
        subtitlePrefix: '💧 Consumo de água:',
      },

      savings: {
        question: 'Quanto dinheiro você quer economizar?',
        placeholder: 'Exemplo: 100',
        subtitlePrefix:
          '💰 Hoje sua meta de economia é',
      },

      mood: {
        chartTitle: 'Gráfico de humor',
        checkInButton: 'Registrar',
        todayLabel: 'Hoje',
        addNotePlaceholder: 'Adicionar uma nota...',
      },

      book: {
        question: 'Qual livro você deseja ler?',
        placeholder: 'Título do livro',
        subtitlePrefix: '📚 Você está lendo',
      },

      market: {
        addButton: 'Adicionar produtos',
      },
    },
  },
  fr: {
    // ======================
    // GLOBAL / SIMPLE
    // ======================
    chipList: 'Voir plus',

    creativeHobbyOptions: [
      'Illustration numérique',
      'Écriture de nouvelles',
      'Broderie créative',
      'Création de bougies artisanales',
      'Photographie esthétique',
      'Production musicale basique',
      'Journaling créatif (journaux visuels)',
      'Macramé décoratif',
      'Pâtisserie créative',
      'Création de contenu créatif (vidéos, reels)',
      'Autres',
    ],

    studySubjectOptions: [
      'Mathématiques',
      'Langue / Espagnol',
      'Anglais',
      'Sciences',
      'Histoire',
      'Géographie',
      'Philosophie',
      'Autres',
    ],

    // ======================
    // VITAMINS / MARKET (ROOT)
    // ======================
    vitamins: {
      question: 'Quelle vitamine as-tu prise ?',
      placeholder: 'ex : Vitamine D',
      subtitlePrefix: '💊 Tu as pris',
      addButton: 'Ajouter des vitamines',
    },

    market: {
      addButton: 'Ajouter des produits',
      modalTitle: 'Ajouter un médicament',
      nameLabel: 'Nom du médicament',
      namePlaceholder: 'Vitamine C, Oméga 3...',
      qtyLabel: 'Quantité',
      qtyPlaceholder: '1',
    },

    // ======================
    // TOUR / MASCOT
    // ======================
    mascotTour: {
      welcomeTitle: 'Bienvenue sur Fluu',
      welcomeText:
        'Salut, je suis Fluffy. Je vais t’accompagner dans ce rapide parcours pour découvrir Fluu et commencer à créer des habitudes à ton rythme. Cela ne prendra que quelques secondes.',

      calendarMainTitle: 'Ton calendrier',
      calendarMainText:
        'Ici, tu verras tout ce que tu as planifié : habitudes, tâches et choses importantes pour chaque jour. Je t’aide à tout garder en ordre.',

      calendarPlusTitle: 'Ajouter quelque chose',
      calendarPlusText:
        'Appuie sur le bouton + en bas à droite et crée de nouvelles habitudes ou activités en quelques secondes.',

      pomodoroTitle: 'Pomodoro',
      pomodoroText:
        'Ici, tu peux te concentrer par sessions et faire des pauses. Je suis avec toi quand tu as besoin de te concentrer.',

      profileTitle: 'Ton profil',
      profileText:
        'D’ici, tu peux changer la couleur de l’app, la langue et tes informations. Tu peux toujours revenir pour ajuster quelque chose.',

      skip: 'Passer le tour',
      next: 'Suivant',
      start: 'Commencer',
    },

    // ======================
    // AUTH
    // ======================
    auth: {
      errorTitle: 'Erreur de connexion',
      errorInvalidCredentials: 'E-mail ou mot de passe incorrect',

      errorTitle: 'Erreur de connexion',
      errorInvalidCredentials: 'E-mail ou mot de passe incorrect',

      errorTitle: 'Erreur de connexion',
      errorInvalidCredentials: 'E-mail ou mot de passe incorrect',

      errorTitle: 'Erreur de connexion',
      errorInvalidCredentials: 'E-mail ou mot de passe incorrect',

      loginTitle: 'Se connecter',
      emailFieldLabel: 'E-mail',
      passwordFieldLabel: 'Mot de passe',
      loginButton: 'Se connecter',
      noAccountLink: "Pas de compte ? S’inscrire",
      emailLabel: 'E-mail',
      passwordLabel: 'Mot de passe',
    },

    // ======================
    // REGISTER
    // ======================
    register: {
      title: 'Créer un compte',
      subtitle: 'Inscris-toi pour commencer à utiliser l’app',
      policyAcceptPrefix: 'J’accepte la ',
      policyAcceptLink: 'politique de confidentialité',
      submit: 'S’inscrire',
      goToLogin: 'Tu as déjà un compte ? Se connecter',
      step1Helper:
        'Crée un compte pour sauvegarder tes habitudes dans le cloud et y accéder depuis n’importe quel appareil.',
      finish: 'Finaliser l’inscription',
    },

    // ======================
    // SETTINGS
    // ======================
    settings: {
      quickSectionTitle: 'Réglages rapides',
    },

    // ======================
    // PROFILE
    // ======================
    profile: {
      languageEs: 'Espagnol',
      languageEn: 'Anglais',
      languagePt: 'Portugais',
      languageFr: 'Français',

      loading: 'Chargement du profil...',

      personalSettingsTitle: 'Paramètres personnels',
      personalSettingsSubtitle: 'Gère tes paramètres personnels',

      save: 'Enregistrer',
      settingsModalTitle: 'Paramètres',
      settingModalTitle: 'Paramètres',
      email: 'E-mail',

      privacyIntro:
        'Ta vie privée est importante pour nous. Découvre comment nous protégeons et utilisons tes données.',
      privacyUseOfDataTitle: 'Utilisation des données',
      privacyUseOfDataText:
        'Nous utilisons tes données uniquement pour améliorer ton expérience dans l’app.',
      privacyUseOfDataBullet1: 'Nous ne vendons jamais tes informations.',
      privacyUseOfDataBullet2:
        'Tes données sont utilisées uniquement pour les fonctionnalités essentielles.',
      privacyUseOfDataBullet3:
        'Tu peux demander la suppression de tes données à tout moment.',
      privacySharingTitle: 'Partage des informations',
      privacySharingText:
        'Nous ne partageons pas tes informations personnelles avec des tiers sans ton consentement.',
      privacyLiabilityTitle: 'Limitation de responsabilité',
      privacyLiabilityText:
        'Nous ne sommes pas responsables d’une mauvaise utilisation de l’app ou des actions de tiers.',
      privacyNotAdviceTitle: 'Pas un avis médical',
      privacyNotAdviceText:
        'Les informations fournies ne remplacent pas l’avis d’un professionnel de santé.',
      privacyRightsTitle: 'Tes droits',
      privacyRightsText:
        'Tu peux accéder, corriger ou supprimer tes données personnelles.',
      privacyMinorsTitle: 'Mineurs',
      privacyMinorsText:
        'L’app n’est pas destinée aux enfants de moins de 13 ans.',
      privacyChangesTitle: 'Modifications de la politique',
      privacyChangesText:
        'Nous te notifierons des changements importants de cette politique.',
      privacyAcceptanceText:
        'En utilisant l’app, tu acceptes notre politique de confidentialité.',
      policyAccept: 'Accepter la politique de confidentialité',

      accountTitle: 'Compte',
      accountSubtitle: 'Gère ton compte et ta confidentialité',

      feedbackTitle: 'Envoyer un feedback',
      feedbackOpen: 'Ouvrir le formulaire',

      privacyPolicy: 'Politique de confidentialité',
      privacyOpenHint: 'Voir les détails de confidentialité',

      deleteAccount: 'Supprimer le compte',
      deleteAccountMessageShort: 'Cette action est définitive',

      moreSettingsButton: 'Plus de paramètres',

      appearanceMode: 'Mode',
      appearanceDark: 'Sombre',
      appearanceLight: 'Clair',

      notificationsTitle: 'Notifications',
      notificationsOn: 'Activées',
      notificationsOff: 'Désactivées',

      appLanguage: 'Langue',

      timeFormatTitle: "Format de l'heure",
      timeFormat12h: '12h',
      timeFormat24h: '24h',
      timeFormatSystem: 'Système',

      personalinfo: 'Profil',
      personalInfo: 'Profil',

      colorBlue: 'Bleu',
      colorPink: 'Rose',
      colorGreen: 'Vert',
      colorPurple: 'Violet',
      colorOrange: 'Orange',

      firstName: 'Prénom',
      lastName: 'Nom',
      age: 'Âge',
      gender: 'Genre',

      genderOptions: {
        male: 'Masculin',
        female: 'Féminin',
        nonBinary: 'Non binaire',
        genderFluid: 'Genre fluide',
        preferNotSay: 'Préfère ne pas dire',
        other: 'Autre',
      },
    },

    // ======================
    // MOOD
    // ======================
    mood: {
      chartTitle: 'Graphique de l’humeur',
      chartSubtitle: 'Ton humeur au fil du temps',
      todayLabel: 'Aujourd’hui',
      checkInTitle: 'Enregistrer l’humeur',
      checkInSubtitle: 'Comment te sens-tu aujourd’hui ?',
      checkInFooter:
        'Tu peux ajouter une note sur ton ressenti.',
    },

    // ======================
    // CALENDAR
    // ======================
    calendar: {
      marketDefaultSectionTitle: 'Liste de courses',
      marketDefaultSectionTitle: 'Courses',
      checklistDefaultSectionTitle: 'Liste de tâches',

      accept: 'Accepter',
      total: 'Total',

      emptyTitle: 'Aucun événement',
      emptySubtitle:
        "Tu n’as pas encore d’habitudes ou d’activités pour ce jour.",

      title: 'Calendrier',

      savingsHalfway:
        'Tu es à mi-chemin de ton objectif d’épargne !',
      addSavings: 'Ajouter une épargne',
      addSavingsPlaceholder: 'ex : 100',
      saveSavings: 'Enregistrer l’épargne',

      endHabitConfirm: 'Terminer l’habitude',

      vitaminsDefaultSectionTitle: 'Vitamines',
      progressLabel: 'Progression',

      addWater: 'Ajouter de l’eau',
      addWaterPlaceholder: 'ex : 250',
      saveWater: 'Enregistrer l’eau',
      waterStartGlass: 'Bois ton premier verre d’eau !',
      waterDoingGreat: 'Tu fais du bon travail, continue !',
      waterGoodStart: 'Bon début !',

      todayButton: "Aujourd’hui",
      edit: 'Modifier',
      delete: 'Supprimer',

      selectHabitTitle: 'Sélectionne une habitude',

      deleteOnlyThis: 'Supprimer seulement celle-ci',
      deleteThisAndNext: 'Supprimer celle-ci et les suivantes',
      cancel: 'Annuler',

      deleteActivityTitle: 'Que veux-tu supprimer ?',
      deleteActivityMessage:
        'Souhaites-tu supprimer seulement cette activité ou celle-ci et toutes les suivantes ?',
    },

    // ======================
    // POMODORO
    // ======================
    pomodoro: {
      title: 'Pomodoro',
      workLabel: 'Travail',
      sessions: 'Sessions',
      preparing: 'Préparation',

      stop: 'Arrêter',
      start: 'Démarrer',

      breakLabel: 'Pause',
      longBreakLabel: 'Pause longue',

      startButton: 'Démarrer',
      stopButton: 'Arrêter',
      resetButton: 'Réinitialiser',

      completedMessage:
        'Pomodoro terminé ! Bon travail !',

      settingsTitle: 'Paramètres Pomodoro',
      quickSettings: 'Réglages rapides',
      presetCustom: 'Personnalisé',
      workMinutes: 'Travail (min)',
      restMinutes: 'Pause (min)',
      total: 'Total des sessions',
      saveConfig: 'Enregistrer',
    },

    // ======================
    // HABIT FORM
    // ======================
    habitForm: {
      savingsSavedLabel: 'Épargne enregistrée',
      savingsSavedHelp:
        'Indique combien d’argent tu as réussi à économiser aujourd’hui.',
      savingsSavedPlaceholder: 'Exemple : 50',

      endLabel: 'Fin',
      endLabel: 'End',
      endLabel: 'Fin',
      endLabel: 'Fin',

      marketPricePlaceholder: '$',
      colorLabel: 'Couleur',
      periodLabel: 'Période',
      startLabel: 'Début',

      hasEndDateQuestion:
        'Cette habitude a-t-elle une date de fin ?',

      waterTargetLabel:
        'Quelle quantité d’eau boiras-tu par jour ? (ml)',
      waterTargetInfo:
        'L’objectif recommandé est de 2000ml (8 verres).',

      frequencyOnce: 'Une fois',
      frequencyDaily: 'Quotidien',
      frequencyWeekly: 'Hebdomadaire',
      frequencyMonthly: 'Mensuel',
      frequencyYearly: 'Annuel',

      saveButton: 'Enregistrer',

      timeLabel: 'Heure',
      iconLabel: 'Icône',
      emojiLabel: 'Emoji',
      descriptionLabel: 'Description',
      notesLabel: 'Notes',
      reminderLabel: 'Rappel',
      goalLabel: 'Objectif',
      unitLabel: 'Unité',
      amountLabel: 'Quantité',
      categoryLabel: 'Catégorie',
      typeLabel: 'Type',
    },

    // ======================
    // SPECIAL HABITS
    // ======================
    specialHabits: {
      call: {
        question: 'Qui vas-tu appeler aujourd’hui ?',
      },

      savingsSavedLabel: 'Épargne enregistrée',
      savingsSavedHelp:
        'Indique combien d’argent tu as réussi à économiser aujourd’hui.',
      savingsSavedPlaceHolder: 'ex : 50',

      birthday: {
        question: "C’est l’anniversaire de qui ?",
        placeholder: 'Nom',
        subtitlePrefix: '🎂 Aujourd’hui, c’est',
      },

      vitamins: {
        question: 'Quelle vitamine as-tu prise ?',
        placeholder: 'ex : Vitamine D',
        subtitlePrefix: '💊 Tu as pris',
        addButton: 'Ajouter des vitamines',
      },

      mood: {
        question: 'Comment te sens-tu aujourd’hui ?',
        placeholder: 'ex : Heureux',
        subtitlePrefix: '😊 Humeur :',
      },

      pomodoro: {
        question: 'Sur quoi vas-tu te concentrer ?',
        placeholder: 'ex : Étude',
        subtitlePrefix: '🍅 Pomodoro :',
      },

      water: {
        question: 'Quelle quantité d’eau as-tu bue ?',
        placeholder: 'ex : 250ml',
        subtitlePrefix: '💧 Consommation d’eau :',
      },

      savings: {
        question: 'Combien d’argent veux-tu économiser ?',
        placeholder: 'Exemple : 100',
        subtitlePrefix:
          '💰 Aujourd’hui, ton objectif d’épargne est',
      },

      mood: {
        chartTitle: 'Graphique de l’humeur',
        checkInButton: 'Enregistrer',
        todayLabel: 'Aujourd’hui',
        addNotePlaceholder: 'Ajouter une note...',
      },

      book: {
        question: 'Quel livre veux-tu lire ?',
        placeholder: 'Titre du livre',
        subtitlePrefix: '📚 Tu lis',
      },

      market: {
        addButton: 'Ajouter des produits',
      },
    },
  },
};

export function translate(path, language) {
  const langKey = translations[language] ? language : 'en';
  const parts = path.split('.');
  let current = translations[langKey];
  for (const p of parts) {
    if (!current || typeof current !== 'object') return path;
    current = current[p];
  }
  return current || path;
}

export function useI18n() {
  const { language } = useSettings();

  const t = useMemo(() => {
    return (path) => translate(path, language);
  }, [language]);

  return { t };
}
