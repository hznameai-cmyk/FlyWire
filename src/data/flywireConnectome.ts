import { NeuropilRegion, CircuitPathway, ConnectomeNeuron, SynapseLink } from '../types';

export const FLYWIRE_GLOBAL_STATS = {
  scientificName: 'Drosophila melanogaster',
  commonName: 'Дрозофила фруктовая (мушка)',
  totalNeurons: 139255,
  totalSynapses: 54500000,
  reconstructedHemispheres: 'Целый мозг (билатеральный коннектом)',
  datasetVersion: 'FlyWire v783 (Nature 2024)',
  cellTypesIdentified: 8453,
  emVoxelResolution: '4 × 4 × 40 nm',
  synapseDetectionMethod: 'Автоматическая сегментация нейросетью + ручная валидация 200+ ученых'
};

export const NEUROPIL_REGIONS: NeuropilRegion[] = [
  {
    id: 'cx',
    name: 'Central Complex (CX)',
    russianName: 'Центральный комплекс (компас и навигация)',
    abbreviation: 'CX',
    category: 'central',
    neuronCount: 3450,
    synapseCount: 1850000,
    color: '#3B82F6', // Blue
    center: { x: 0, y: 15, z: 20 },
    radius: 38,
    description: 'Кольцевой нейронный компас мухи. Содержит эллипсоидное тело (EB), протоцеребральный мост (PB) и веерообразное тело (FB). Нейроны EPG генерируют локализованную волну возбуждения («bump»), которая вращается строго синхронно с ориентацией мухи относительно солнца и поляризованного света.',
    functions: [
      'Определение курса относительно солнца (компас EPG)',
      'Интеграция пройденного пути (векторное одометрирование)',
      'Координация скорости и направления полёта',
      'Выбор между реакцией побега и исследовательским поведением'
    ],
    keyNeuronTypes: ['EPG (Compass)', 'Delta7 (Bridge)', 'P-EN (Velocity integrator)', 'FB columnar'],
    transmitters: [
      { name: 'Acetylcholine (ACh)', percentage: 55, color: '#38BDF8' },
      { name: 'GABA', percentage: 32, color: '#F43F5E' },
      { name: 'Glutamate', percentage: 13, color: '#10B981' }
    ]
  },
  {
    id: 'mb',
    name: 'Mushroom Body (MB)',
    russianName: 'Грибовидные тела (память и ассоциативное обучение)',
    abbreviation: 'MB',
    category: 'learning',
    neuronCount: 5200,
    synapseCount: 3100000,
    color: '#8B5CF6', // Purple
    center: { x: -28, y: -10, z: 35 },
    radius: 44,
    description: 'Высший центр памяти и обонятельного обучения. Около 2000 клеток Кеньона (KC) в каждом полушарии получают случайные паттерны запахов от антеннальной доли. Дофаминергические нейроны (DANs) передают награду (сахар) или наказание (электрошок), модифицируя синапсы на выходных нейронах MBON.',
    functions: [
      'Ассоциативная память (запах + награда/наказание)',
      'Разреженное кодирование запахов клетками Кеньона',
      'Принятие решений о приближении к пище или бегстве',
      'Контекстно-зависимая модуляция поведения дофамином'
    ],
    keyNeuronTypes: ['Kenyon Cells (KC-α/β, KC-γ)', 'MBON (Mushroom Body Output)', 'DAN (Dopaminergic input)'],
    transmitters: [
      { name: 'Acetylcholine', percentage: 68, color: '#38BDF8' },
      { name: 'Dopamine', percentage: 18, color: '#EC4899' },
      { name: 'GABA', percentage: 14, color: '#F43F5E' }
    ]
  },
  {
    id: 'ol_left',
    name: 'Left Optic Lobe (OL-L)',
    russianName: 'Левая зрительная доля (фасеточный глаз)',
    abbreviation: 'OL-L',
    category: 'sensory',
    neuronCount: 58000,
    synapseCount: 22000000,
    color: '#10B981', // Emerald
    center: { x: -70, y: 0, z: -10 },
    radius: 52,
    description: 'Обрабатывает сигнал от ~800 омматидиев сложного глаза. Состоит из пластинки (Lamina), медуллы (Medulla), лобулы (Lobula) и пластинки лобулы (Lobula Plate). Нейроны T4 и T5 вычисляют оптический поток и вектор направления движения со скоростью до 200 кадров/сек.',
    functions: [
      'Детекция оптического потока (детекторы движения T4/T5)',
      'Распознавание поляризации неба для солнечной навигации',
      'Детекция быстро приближающегося хищника (looming detector)',
      'Стабилизация горизонта при резких маневрах'
    ],
    keyNeuronTypes: ['T4 (On-motion)', 'T5 (Off-motion)', 'Mi1/Tm1', 'LPLC2 (Looming escape)'],
    transmitters: [
      { name: 'Acetylcholine', percentage: 48, color: '#38BDF8' },
      { name: 'GABA', percentage: 38, color: '#F43F5E' },
      { name: 'Glutamate', percentage: 14, color: '#10B981' }
    ]
  },
  {
    id: 'ol_right',
    name: 'Right Optic Lobe (OL-R)',
    russianName: 'Правая зрительная доля (фасеточный глаз)',
    abbreviation: 'OL-R',
    category: 'sensory',
    neuronCount: 58000,
    synapseCount: 22000000,
    color: '#10B981', // Emerald
    center: { x: 70, y: 0, z: -10 },
    radius: 52,
    description: 'Правый зрительный вычислитель, симметричный левой доле. Содержит более 40% всех нейронов мозга дрозофилы. Передает бинокулярный сигнал на нисходящие нейроны для уклонения от удара мухобойки.',
    functions: [
      'Бинокулярное вычисление скорости сближения',
      'Синхронизация взмахов правого крыла с левым',
      'Оптический контроль курса и посадки'
    ],
    keyNeuronTypes: ['T4 (On-motion)', 'T5 (Off-motion)', 'VS/HS (Tangential cells)', 'LPLC2'],
    transmitters: [
      { name: 'Acetylcholine', percentage: 48, color: '#38BDF8' },
      { name: 'GABA', percentage: 38, color: '#F43F5E' },
      { name: 'Glutamate', percentage: 14, color: '#10B981' }
    ]
  },
  {
    id: 'al',
    name: 'Antennal Lobes (AL)',
    russianName: 'Антеннальные доли (карта 51 клубочка запахов)',
    abbreviation: 'AL',
    category: 'sensory',
    neuronCount: 2200,
    synapseCount: 980000,
    color: '#F59E0B', // Amber
    center: { x: 0, y: -42, z: -25 },
    radius: 30,
    description: 'Обонятельный процессор. Сигналы от сенсилл на усиках приходят в 51 специализированный клубочек (гломерулу). Каждый клубочек кодирует определенный химический класс (брожение дрожжей, уксус, феромон cVA, запах хищной плесени геосмин).',
    functions: [
      'Распознавание запаха спелых плодов и дрожжей',
      'Детекция опасного запаха плесени (клубочек DA2)',
      'Обработка половых феромонов (клубочек DA1)',
      'Передача топографической карты запахов в грибовидные тела'
    ],
    keyNeuronTypes: ['Projection Neurons (uPN, mPN)', 'Local Interneurons (LN)', 'ORNs'],
    transmitters: [
      { name: 'Acetylcholine', percentage: 60, color: '#38BDF8' },
      { name: 'GABA', percentage: 35, color: '#F43F5E' },
      { name: 'Histamine', percentage: 5, color: '#F59E0B' }
    ]
  },
  {
    id: 'sez',
    name: 'Subesophageal Zone (SEZ)',
    russianName: 'Подглоточная зона (вкус и управление хоботком)',
    abbreviation: 'SEZ',
    category: 'motor',
    neuronCount: 4600,
    synapseCount: 2100000,
    color: '#EC4899', // Pink
    center: { x: 0, y: -55, z: 15 },
    radius: 36,
    description: 'Центр вкуса и моторного контроля приёма пищи. Получает сигналы от вкусовых волосков на лапках и хоботке. Запускает безусловный рефлекс выдвижения хоботка (PER — Proboscis Extension Reflex) при контакте с сахарозой.',
    functions: [
      'Вкусовая дискриминация (сладкое, горькое, соленое, вода)',
      'Управление моторикой хоботка и заглатыванием',
      'Контроль сытости и пищевой мотивации',
      'Координация груминга (чистки лапок и глаз)'
    ],
    keyNeuronTypes: ['Fdg (Feeding command)', 'MN9 (Proboscis motor)', 'Gr5a (Sugar receptor cells)'],
    transmitters: [
      { name: 'Acetylcholine', percentage: 52, color: '#38BDF8' },
      { name: 'Glutamate', percentage: 28, color: '#10B981' },
      { name: 'Serotonin/Octopamine', percentage: 20, color: '#EAB308' }
    ]
  },
  {
    id: 'dn',
    name: 'Descending Neurons (DN)',
    russianName: 'Нисходящие нейроны (канал команд в грудной ганглий)',
    abbreviation: 'DN',
    category: 'motor',
    neuronCount: 1300,
    synapseCount: 1400000,
    color: '#EF4444', // Red
    center: { x: 0, y: -25, z: 65 },
    radius: 28,
    description: 'Магистральная шина связи мозга с мышцами крыльев и лапок в тораксе (~650 пар нейронов). Включает гигантское волокно (Giant Fiber / GF), которое при угрозе вызывает прыжок и расправление крыльев за рекордные 5 миллисекунд.',
    functions: [
      'Взрывной прыжок спасения (Giant Fiber escape reflex)',
      'Коррекция курса крыльев (асимметричный взмах)',
      'Координация шага и остановки (MDN - Moonwalker)',
      'Запуск посадочного вытягивания лапок'
    ],
    keyNeuronTypes: ['Giant Fiber (GF)', 'DNa02 (Steering)', 'DNp09 (Landing)', 'MDN (Backward walking)'],
    transmitters: [
      { name: 'Acetylcholine', percentage: 70, color: '#38BDF8' },
      { name: 'Glutamate', percentage: 22, color: '#10B981' },
      { name: 'GABA', percentage: 8, color: '#F43F5E' }
    ]
  }
];

export const CIRCUIT_PATHWAYS: CircuitPathway[] = [
  {
    id: 'escape_reflex',
    name: 'Visual Threat Escape (Giant Fiber Circuit)',
    russianName: 'Рефлекс спасения от мухобойки (Цепь Giant Fiber)',
    stimulus: 'Быстрорастущее темное пятно на сетчатке (Looming shadow)',
    behavioralOutput: 'Молниеносный толчок средних лапок + взмах крыльев за 5 мс',
    latencyMs: 5.2,
    nodes: [
      { regionId: 'ol_left', label: 'LPLC2 / LC4', role: 'Детектор приближающейся тени в зрительной доле', transmitter: 'ACh' },
      { regionId: 'cx', label: 'SMP / Central hub', role: 'Оценка вероятности столкновения', transmitter: 'ACh' },
      { regionId: 'dn', label: 'Giant Fiber (GF)', role: 'Командный нейрон взрывного прыжка спасения', transmitter: 'ACh / Gap Junction' },
      { regionId: 'dn', label: 'TTMn / DLMn', role: 'Активация мышц бедра средних лапок и крыльев', transmitter: 'ACh' }
    ],
    description: 'Самая быстрая цепь побега у насекомых. Электрические синапсы (gap junctions) и гигантские аксоны обеспечивают спасение дрозофилы до того, как мухобойка коснется поверхности.'
  },
  {
    id: 'sun_compass',
    name: 'Sun-Compass Heading & Path Integration',
    russianName: 'Солнечный компас и интеграция пути',
    stimulus: 'Угол падения поляризованного света неба (Дорсальный ободок глаза DRA)',
    behavioralOutput: 'Удержание прямого курса полета по ветру или к источнику запаха',
    latencyMs: 18.0,
    nodes: [
      { regionId: 'ol_right', label: 'DRA photoreceptors', role: 'Улавливание e-вектора поляризации ультрафиолета', transmitter: 'Histamine' },
      { regionId: 'cx', label: 'AOTU -> Bulbs', role: 'Перекодирование поляризации в вектор угла', transmitter: 'ACh' },
      { regionId: 'cx', label: 'EPG (Compass ring)', role: 'Вращающийся бугорок возбуждения («Bump») в эллипсоидном теле', transmitter: 'ACh / GABA' },
      { regionId: 'cx', label: 'P-EN / Delta7', role: 'Интеграция угловой скорости поворота', transmitter: 'ACh' },
      { regionId: 'dn', label: 'DNa02 / Steering', role: 'Асимметричная коррекция частоты взмахов крыльев', transmitter: 'Glutamate' }
    ],
    description: 'В эллипсоидном теле (EB) активность 16 клиновидных колонок образует бегущую волну. Когда муха поворачивается на 90°, пик активности смещается на 90° по кольцу.'
  },
  {
    id: 'odor_learning',
    name: 'Associative Olfactory Memory (Sugar vs Shock)',
    russianName: 'Ассоциативная память запахов (Грибные тела)',
    stimulus: 'Запах банана (этилацетат) + подслащенная вода на лапке',
    behavioralOutput: 'Стойкое предпочтение этого запаха в Т-образном лабиринте',
    latencyMs: 45.0,
    nodes: [
      { regionId: 'al', label: 'Glomerulus DM1', role: 'Активация специфического рецептора Or42b', transmitter: 'ACh' },
      { regionId: 'mb', label: 'Kenyon Cells (KC)', role: 'Разреженная активация 5% популяции клеток Кеньона', transmitter: 'ACh' },
      { regionId: 'mb', label: 'PPL1 / PAM (DAN)', role: 'Всплеск дофамина при распознавании сахара', transmitter: 'Dopamine' },
      { regionId: 'mb', label: 'MBON-γ1pedc', role: 'Пластическое синаптическое ослабление избегания (LTD)', transmitter: 'GABA' },
      { regionId: 'sez', label: 'Feeding / Attraction', role: 'Активация программы следования за запахом', transmitter: 'ACh' }
    ],
    description: 'В синапсах между клетками Кеньона и выходными нейронами MBON дофамин модулирует вес связи: запах банана перестает быть нейтральным и вызывает положительную валентность.'
  },
  {
    id: 'sugar_feeding',
    name: 'Proboscis Extension Reflex (PER)',
    russianName: 'Безусловный пищевой рефлекс (PER)',
    stimulus: 'Капля 10% сахарозы касается вкусовых волосков передней лапки',
    behavioralOutput: 'Мгновенное разгибание хоботка и выкачивание питательного сока',
    latencyMs: 14.5,
    nodes: [
      { regionId: 'sez', label: 'Gr5a / Gr64a', role: 'Вкусовые нейроны сенсилл передней лапки', transmitter: 'ACh' },
      { regionId: 'sez', label: 'Fdg Interneurons', role: 'Командные нейроны пищевой программы в SEZ', transmitter: 'ACh' },
      { regionId: 'sez', label: 'MN9 Motor neuron', role: 'Мышцы разгибатели дистального отдела ротового аппарата', transmitter: 'Glutamate' }
    ],
    description: 'Классический тест на насыщение и вкусовую память. Если муха голодна, синаптический фильтр в подглоточной зоне открыт.'
  }
];

export const CONNECTOME_FEATURED_NEURONS: ConnectomeNeuron[] = [
  {
    id: 'epg_compass_01',
    flywireId: '720575940614120344',
    name: 'EPG (Compass Column 4)',
    type: 'Ring Attractor Neuron',
    neuropil: 'cx',
    position: { x: 0, y: 14, z: 22 },
    polarity: 'interneuron',
    transmitter: 'ACh',
    connectionsCount: 842
  },
  {
    id: 'giant_fiber_l',
    flywireId: '720575940624912015',
    name: 'Giant Fiber Left (GF-L)',
    type: 'Escape Command Neuron',
    neuropil: 'dn',
    position: { x: -6, y: -22, z: 62 },
    polarity: 'motor',
    transmitter: 'ACh',
    connectionsCount: 1420
  },
  {
    id: 'kc_alpha_beta_42',
    flywireId: '720575940608933211',
    name: 'Kenyon Cell α/β-core',
    type: 'Memory Substrate',
    neuropil: 'mb',
    position: { x: -26, y: -12, z: 32 },
    polarity: 'interneuron',
    transmitter: 'ACh',
    connectionsCount: 650
  },
  {
    id: 't4_motion_detector',
    flywireId: '720575940631248099',
    name: 'T4a Directional Motion Detector',
    type: 'Optical Flow Columnar',
    neuropil: 'ol_left',
    position: { x: -65, y: 2, z: -8 },
    polarity: 'sensory',
    transmitter: 'ACh',
    connectionsCount: 920
  },
  {
    id: 'dan_pam_cluster',
    flywireId: '720575940618345712',
    name: 'PAM Dopaminergic Sugar Reward',
    type: 'Reward Modulator',
    neuropil: 'mb',
    position: { x: -18, y: -14, z: 40 },
    polarity: 'neuroendocrine',
    transmitter: 'Dopamine',
    connectionsCount: 1105
  },
  {
    id: 'fdg_feeding_command',
    flywireId: '720575940628881240',
    name: 'Fdg (Feeding Command)',
    type: 'Proboscis Activator',
    neuropil: 'sez',
    position: { x: 2, y: -52, z: 18 },
    polarity: 'motor',
    transmitter: 'ACh',
    connectionsCount: 780
  }
];
