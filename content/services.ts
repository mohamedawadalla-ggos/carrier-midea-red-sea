type Copy = Readonly<{ ar: string; en: string }>;
const copy = (ar: string, en: string): Copy => ({ ar, en });

export type ServiceStep = Readonly<{ title: Copy; description: Copy }>;
export type ServiceExample = Readonly<{ title: Copy; description: Copy }>;

export type ServiceDetail = Readonly<{
  id: string;
  slug: string;
  number: string;
  title: Copy;
  summary: Copy;
  imagePath: string | null;
  assetAuthorization: "approved" | "pending";
  steps: readonly ServiceStep[];
  examples: readonly ServiceExample[];
}>;

export const services: readonly ServiceDetail[] = [
  {
    id: "installation-and-fit-out",
    slug: "installation-and-fit-out",
    number: "01",
    title: copy("التركيب والتأسيس", "Installation & fit-out"),
    summary: copy(
      "معاينة دقيقة، اختيار القدرة المناسبة، وتركيب يحافظ على كفاءة جهازك.",
      "Accurate inspection, capacity selection, and installation that protects efficiency.",
    ),
    imagePath: "/services/installation-and-fit-out.webp",
    assetAuthorization: "approved",
    steps: [
      {
        title: copy("معاينة الموقع وحساب الحمل الحراري", "Site survey and cooling-load calculation"),
        description: copy(
          "قياس مساحة وارتفاع الغرفة، واتجاهها الشمسي، وعدد الأشخاص ومصادر الحرارة الداخلية لتحديد القدرة المناسبة بالحصان بدقة.",
          "Measuring room area, ceiling height, sun exposure, occupancy, and internal heat sources to size the correct horsepower.",
        ),
      },
      {
        title: copy("اختيار موضع الوحدتين الداخلية والخارجية", "Positioning the indoor and outdoor units"),
        description: copy(
          "تحديد مكان يضمن توزيع هواء متجانس داخل الغرفة، وتهوية كافية للوحدة الخارجية، وأقصر مسار ممكن لخط التبريد.",
          "Choosing placement that gives even air distribution indoors, adequate airflow around the outdoor unit, and the shortest practical refrigerant line run.",
        ),
      },
      {
        title: copy("مد خطوط التبريد واختبار التفريغ والضغط", "Refrigerant line routing and vacuum/pressure testing"),
        description: copy(
          "لحام مواسير النحاس، وسحب فراغ (Vacuum) للتأكد من خلو الدائرة من الرطوبة والهواء، واختبار الضغط قبل الشحن بالغاز.",
          "Brazing the copper lines, pulling a vacuum to remove moisture and air from the circuit, and pressure-testing before charging refrigerant.",
        ),
      },
      {
        title: copy("التوصيل الكهربائي والحماية", "Electrical connection and protection"),
        description: copy(
          "تركيب دائرة كهربائية مستقلة بقاطع حماية مناسب لتيار الوحدة، وتأريض سليم لحماية الجهاز والمستخدم.",
          "Wiring a dedicated circuit with a breaker sized to the unit's current draw, with proper earthing for both equipment and user safety.",
        ),
      },
      {
        title: copy("التشغيل التجريبي وقياس الأداء", "Commissioning and performance check"),
        description: copy(
          "تشغيل الوحدة وقياس فرق درجة الحرارة بين الهواء الداخل والخارج للتأكد من كفاءة التبريد قبل تسليم العمل.",
          "Running the unit and measuring the temperature split between supply and return air to confirm cooling performance before handover.",
        ),
      },
    ],
    examples: [
      {
        title: copy("غرفة نوم بعزل جيد (حوالي 12 م²)", "Well-insulated bedroom (~12 m²)"),
        description: copy("عادة ما تكفيها وحدة 1.5 حصان.", "Usually served well by a 1.5 HP unit."),
      },
      {
        title: copy("صالة معيشة 25-30 م² بإضاءة كبيرة أو اتجاه شمسي مباشر", "25-30 m² living room with large glazing or direct sun exposure"),
        description: copy("غالبًا تحتاج قدرة من 2.25 إلى 3 حصان.", "Typically needs 2.25 to 3 HP of capacity."),
      },
      {
        title: copy("محل تجاري أو مكتب متوسط المساحة بعدد زوار مرتفع", "Mid-sized shop or office with high foot traffic"),
        description: copy(
          "يُحسب الحمل الحراري بدقة أكبر، وغالبًا ما يُنصح بقدرات من 4 حصان فأكثر أو توزيع أكثر من وحدة.",
          "Requires a more detailed load calculation, often pointing to 4 HP or more, or splitting the load across multiple units.",
        ),
      },
    ],
  },
  {
    id: "maintenance-and-repair",
    slug: "maintenance-and-repair",
    number: "02",
    title: copy("الصيانة والإصلاح", "Maintenance & repair"),
    summary: copy(
      "تشخيص واضح وإصلاحات موثوقة للأعطال الشائعة والمعقدة.",
      "Clear diagnosis and dependable repairs for simple and complex faults.",
    ),
    imagePath: "/services/maintenance-and-repair.webp",
    assetAuthorization: "approved",
    steps: [
      {
        title: copy("التشخيص الأولي", "Initial diagnosis"),
        description: copy(
          "فحص بصري للوحدتين الداخلية والخارجية، وقراءة أكواد الأعطال إن وجدت في الموديلات الحديثة.",
          "A visual check of both indoor and outdoor units, plus reading any fault codes on modern control boards.",
        ),
      },
      {
        title: copy("فحص دائرة التبريد", "Refrigerant circuit check"),
        description: copy(
          "قياس ضغط الغاز ودرجات الحرارة للتأكد من عدم وجود تسريب أو نقص في شحنة الغاز.",
          "Measuring refrigerant pressure and temperatures to rule out leaks or an undercharged system.",
        ),
      },
      {
        title: copy("فحص الكهرباء والتحكم", "Electrical and control check"),
        description: copy(
          "قياس الجهد والتيار وفحص لوحة التحكم والحساسات لاستبعاد الأعطال الكهربائية.",
          "Measuring voltage and current and inspecting the control board and sensors to rule out electrical faults.",
        ),
      },
      {
        title: copy("الإصلاح واستبدال القطع", "Repair and parts replacement"),
        description: copy(
          "إصلاح أو استبدال القطعة التالفة، مثل الكمبروسر أو المروحة أو لوحة التحكم، باستخدام قطع أصلية حيثما أمكن.",
          "Repairing or replacing the faulty part -- compressor, fan motor, control board and similar -- using original parts wherever possible.",
        ),
      },
      {
        title: copy("اختبار ما بعد الإصلاح", "Post-repair verification"),
        description: copy(
          "إعادة تشغيل الوحدة تحت المراقبة للتأكد من استقرار الأداء بعد التدخل.",
          "Running the unit under observation to confirm stable performance after the repair.",
        ),
      },
    ],
    examples: [
      {
        title: copy("ضعف في التبريد مع استمرار عمل الوحدة", "Weak cooling while the unit keeps running"),
        description: copy(
          "غالبًا مرتبط بنقص شحنة الغاز أو اتساخ المكثف الخارجي.",
          "Often linked to a low refrigerant charge or a dirty outdoor condenser.",
        ),
      },
      {
        title: copy("تسريب مياه من الوحدة الداخلية", "Water leaking from the indoor unit"),
        description: copy(
          "السبب الأكثر شيوعًا هو انسداد خط الصرف أو عدم استواء تركيب الوحدة.",
          "The most common cause is a blocked drain line or an indoor unit that isn't level.",
        ),
      },
      {
        title: copy("صوت غير معتاد أو اهتزاز من الوحدة الخارجية", "Unusual noise or vibration from the outdoor unit"),
        description: copy(
          "قد يشير إلى فك تثبيت الوحدة أو عطل في المروحة أو الكمبروسر.",
          "Can point to loose mounting, a failing fan motor, or a compressor issue.",
        ),
      },
    ],
  },
  {
    id: "deep-cleaning",
    slug: "deep-cleaning",
    number: "03",
    title: copy("التنظيف العميق", "Deep cleaning"),
    summary: copy(
      "تنظيف احترافي يحسن جودة الهواء ويستعيد كفاءة التبريد.",
      "Professional cleaning that improves air quality and restores cooling performance.",
    ),
    imagePath: "/services/deep-cleaning.webp",
    assetAuthorization: "approved",
    steps: [
      {
        title: copy("فحص حالة الوحدة قبل التنظيف", "Pre-clean condition check"),
        description: copy(
          "تحديد درجة الاتساخ ومستوى الأداء الحالي كمرجع للمقارنة بعد التنظيف.",
          "Assessing how dirty the unit is and recording current performance as a baseline for comparison afterward.",
        ),
      },
      {
        title: copy("تنظيف المبخر (الوحدة الداخلية)", "Cleaning the evaporator (indoor unit)"),
        description: copy(
          "غسل مواسير الألومنيوم والفلاتر لإزالة الغبار والدهون المتراكمة التي تقلل كفاءة التبادل الحراري.",
          "Washing the aluminum fins and filters to remove built-up dust and grease that reduce heat-exchange efficiency.",
        ),
      },
      {
        title: copy("تنظيف المكثف (الوحدة الخارجية)", "Cleaning the condenser (outdoor unit)"),
        description: copy(
          "إزالة الأتربة والرمال المتراكمة على الزعانف المعدنية التي تعيق تبريد الغاز.",
          "Removing dust and sand build-up from the metal fins that otherwise restricts refrigerant cooling.",
        ),
      },
      {
        title: copy("تنظيف خط الصرف والتعقيم", "Drain line clearing and sanitizing"),
        description: copy(
          "التأكد من انسياب المياه بسلاسة، وتعقيم الوحدة للحد من الروائح والبكتيريا.",
          "Making sure condensate drains freely, and sanitizing the unit to reduce odors and bacteria.",
        ),
      },
      {
        title: copy("اختبار الأداء بعد التنظيف", "Post-clean performance check"),
        description: copy(
          "قياس فرق درجة الحرارة ومقارنته بالقياس المرجعي قبل التنظيف.",
          "Measuring the temperature split again and comparing it against the pre-clean baseline.",
        ),
      },
    ],
    examples: [
      {
        title: copy("تكييف يعمل منذ أكثر من 6 أشهر دون تنظيف", "An AC running more than 6 months without cleaning"),
        description: copy(
          "غالبًا يفقد جزءًا ملحوظًا من كفاءة التبريد بسبب اتساخ المبادلات الحرارية.",
          "Typically loses a noticeable share of cooling efficiency as its heat exchangers get dirty.",
        ),
      },
      {
        title: copy("منزل قريب من الساحل أو منطقة رملية", "A home near the coast or a sandy area"),
        description: copy(
          "يحتاج لتنظيف الوحدة الخارجية بمعدل أعلى بسبب تراكم الرمال والأملاح.",
          "Needs more frequent outdoor-unit cleaning because of sand and salt build-up.",
        ),
      },
      {
        title: copy("شكاوى من رائحة غير مستحبة عند التشغيل", "Complaints of an unpleasant smell on startup"),
        description: copy(
          "غالبًا مرتبطة بتراكم الرطوبة والأتربة داخل الوحدة، وتُعالج بالتنظيف والتعقيم.",
          "Usually linked to moisture and dust build-up inside the unit, addressed by cleaning and sanitizing.",
        ),
      },
    ],
  },
  {
    id: "annual-contracts",
    slug: "annual-contracts",
    number: "04",
    title: copy("العقود السنوية", "Annual contracts"),
    summary: copy(
      "زيارات وقائية مجدولة للفلل، الشركات، الفنادق والمنتجعات.",
      "Scheduled preventive visits for villas, companies, hotels and resorts.",
    ),
    imagePath: "/services/annual-contracts.webp",
    assetAuthorization: "approved",
    steps: [
      {
        title: copy("تحديد نطاق العقد", "Defining the contract scope"),
        description: copy(
          "عدد الوحدات، وعدد الزيارات السنوية، ونوع المنشأة (فيلا، شركة، فندق، منتجع).",
          "Number of units, number of visits per year, and the type of property -- villa, company, hotel, or resort.",
        ),
      },
      {
        title: copy("جدولة الزيارات الوقائية", "Scheduling preventive visits"),
        description: copy(
          "زيارات دورية منتظمة، عادة من 2 إلى 4 زيارات سنويًا حسب حجم الاستخدام، تشمل الفحص والتنظيف الأساسي.",
          "Regular scheduled visits -- usually 2 to 4 per year depending on usage -- covering inspection and basic cleaning.",
        ),
      },
      {
        title: copy("تقرير حالة بعد كل زيارة", "A condition report after every visit"),
        description: copy(
          "توثيق حالة كل وحدة والتوصيات اللازمة، مثل إصلاح أو استبدال قطعة أو ضبط إضافي.",
          "Documenting each unit's condition and any recommendations -- a repair, a part replacement, or a further adjustment.",
        ),
      },
      {
        title: copy("أولوية الاستجابة للأعطال الطارئة", "Priority response for urgent faults"),
        description: copy(
          "استجابة أسرع لعملاء العقود السنوية عند وجود عطل خارج الزيارات المجدولة.",
          "Faster response for annual-contract customers when a fault comes up outside the scheduled visits.",
        ),
      },
    ],
    examples: [
      {
        title: copy("فيلا بها 5 إلى 8 وحدات تكييف", "A villa with 5 to 8 AC units"),
        description: copy(
          "عقد بزيارتين سنويًا يغطي الصيانة الوقائية الأساسية قبل وبعد فترة الذروة الصيفية.",
          "A two-visit-per-year contract covering basic preventive care before and after peak summer.",
        ),
      },
      {
        title: copy("فندق أو منتجع بعدد وحدات كبير", "A hotel or resort with a large number of units"),
        description: copy(
          "عقد بزيارات ربع سنوية مع أولوية استجابة أسرع نظرًا لتأثير الأعطال على نزلاء الفندق مباشرة.",
          "A quarterly-visit contract with faster priority response, since faults directly affect guests.",
        ),
      },
      {
        title: copy("شركة أو مكتب بعدد ساعات تشغيل يومي مرتفع", "A company or office running units long hours daily"),
        description: copy(
          "عقد يشمل فحوصات إضافية لأجزاء التحكم والكهرباء نظرًا لساعات التشغيل الطويلة.",
          "A contract with extra checks on controls and electrical components given the long daily run hours.",
        ),
      },
    ],
  },
] as const;

export function getService(slug: string): ServiceDetail | undefined {
  return services.find((service) => service.slug === slug);
}
