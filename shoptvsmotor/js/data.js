// TVS Motors product catalog
const PRODUCTS = [
  { id:1, name:"Premium Leather Seat Cover Set", category:"Interior", price:129.99, old:179.99, img:"images/p1.jpg", rating:4.7, reviews:184, tag:"BESTSELLER",
    desc:"Hand-stitched genuine leather seat covers designed for premium comfort and a luxury cabin look. Universal fit for most sedans and SUVs.",
    specs:{Material:"Genuine Leather",Fit:"Universal",Color:"Jet Black",Warranty:"2 Years",Pieces:"9-Piece Set"}},
  { id:2, name:"Forged Alloy Wheel 18\" - Chrome", category:"Wheels", price:289.00, old:349.00, img:"images/p2.jpg", rating:4.8, reviews:96, tag:"NEW",
    desc:"Lightweight forged alloy wheel with multi-spoke chrome finish. Built for performance, balanced, and corrosion resistant.",
    specs:{Diameter:"18 inch",Material:"Forged Aluminium",Finish:"Polished Chrome",Bolt:"5x114.3",Weight:"8.4 kg"}},
  { id:3, name:"LED Headlight Bulbs H4 Pair", category:"Lighting", price:49.99, old:69.99, img:"images/p3.jpg", rating:4.6, reviews:412, tag:"-30%",
    desc:"Ultra-bright 12000 lumen LED headlight bulbs with IP68 waterproof rating. Plug-and-play install in under 10 minutes.",
    specs:{Brightness:"12000 LM",Color:"6500K White",Lifespan:"50000 hrs",Voltage:"9-32V",Warranty:"3 Years"}},
  { id:4, name:"Android 10\" Touchscreen Stereo", category:"Electronics", price:219.00, old:289.00, img:"images/p4.jpg", rating:4.5, reviews:227,
    desc:"Android 13 powered car stereo with CarPlay, Android Auto, GPS navigation, Bluetooth 5.0 and a 10\" capacitive HD touchscreen.",
    specs:{Screen:"10 inch IPS",OS:"Android 13",RAM:"4GB",Storage:"64GB",Connectivity:"WiFi, BT 5.0, GPS"}},
  { id:5, name:"4K Dashcam with Night Vision", category:"Electronics", price:99.99, old:139.99, img:"images/p5.jpg", rating:4.7, reviews:531, tag:"HOT",
    desc:"4K Ultra HD front dashcam with built-in WiFi, Sony Starvis sensor for night vision, G-sensor and 24-hour parking mode.",
    specs:{Resolution:"4K @ 30fps",Sensor:"Sony IMX415",Storage:"Up to 256GB",Features:"WiFi, GPS, Parking Mode",Display:"3 inch IPS"}},
  { id:6, name:"Sport Steering Wheel Cover - Leather", category:"Interior", price:24.99, old:34.99, img:"images/p6.jpg", rating:4.4, reviews:803,
    desc:"Anti-slip perforated leather steering cover with reinforced grip zones. Fits all standard 38cm steering wheels.",
    specs:{Material:"Microfiber Leather",Diameter:"37-38 cm",Fit:"Universal",Color:"Black",Style:"Sport Grip"}},
  { id:7, name:"Roof Cargo Carrier Box 500L", category:"Exterior", price:399.00, old:499.00, img:"images/p7.jpg", rating:4.8, reviews:64, tag:"NEW",
    desc:"500L aerodynamic roof box with dual-side opening and quick-mount clamps. Lockable and waterproof.",
    specs:{Capacity:"500 Liters",Material:"ABS Plastic",Lock:"Yes - 2 Keys",Mount:"Universal Rail",Dimensions:"205 x 84 x 45 cm"}},
  { id:8, name:"All-Weather TPE Floor Mats", category:"Interior", price:79.99, old:99.99, img:"images/p8.jpg", rating:4.9, reviews:1208, tag:"TOP RATED",
    desc:"Custom-fit all-weather TPE floor mats with raised edges to trap dirt, water and snow. Easy to clean.",
    specs:{Material:"TPE Rubber",Fit:"Universal/Custom",Pieces:"4-Piece Set",Color:"Black",Warranty:"Lifetime"}}
];

const CATEGORIES = [
  {name:"Interior",icon:"🛋️",count:42},
  {name:"Exterior",icon:"🚗",count:38},
  {name:"Lighting",icon:"💡",count:54},
  {name:"Electronics",icon:"📱",count:67},
  {name:"Wheels",icon:"⚙️",count:29},
  {name:"Performance",icon:"⚡",count:33},
  {name:"Safety",icon:"🛡️",count:21},
  {name:"Tools",icon:"🔧",count:48}
];

const SHOP_CATEGORIES = [
  { name:"Seat Covers", slug:"seat-covers", img:"images/p1.jpg", cat:"Interior" },
  { name:"Crash Guards", slug:"crash-guards", img:"images/p2.jpg", cat:"Exterior" },
  { name:"Top Boxes", slug:"top-boxes", img:"images/p7.jpg", cat:"Exterior" },
  { name:"Lighting", slug:"lighting", img:"images/p3.jpg", cat:"Lighting" },
  { name:"Electronics", slug:"electronics", img:"images/p4.jpg", cat:"Electronics" },
  { name:"Wheels & Alloys", slug:"wheels-alloys", img:"images/p2.jpg", cat:"Wheels" },
  { name:"Floor Mats", slug:"floor-mats", img:"images/p8.jpg", cat:"Interior" },
  { name:"Riding Gear", slug:"riding-gear", img:"images/p5.jpg", cat:"Interior" }
];

const VEHICLE_MODELS = [
  { id:"tvs-ronin-2025-edition", name:"TVS RONIN 2025 EDITION", img:"https://shop.tvsmotor.com/cdn/shop/files/Group_3_1.webp?v=1765733217" },
  { id:"apache310", name:"TVS APACHE RTR 310", img:"https://shop.tvsmotor.com/cdn/shop/files/TVS_Apache_RTR_310_290x_4c281f7c-9ac9-4cbb-b0ed-c12ebc2add55.png?v=1713157859" },
  { id:"rtx", name:"TVS APACHE RTX", img:"https://shop.tvsmotor.com/cdn/shop/files/XYZN59777.png?v=1760522534" },
  { id:"jupiter", name:"TVS JUPITER", img:"https://shop.tvsmotor.com/cdn/shop/files/Jupiter_290x_0040c3ea-3bd3-41c0-940d-72320b71b7fc.png?v=1765533487" },
  { id:"raider", name:"TVS RAIDER", img:"https://shop.tvsmotor.com/cdn/shop/files/Raider_290x_67ebbbf2-cc21-463f-af6f-fbef99266de9.png?v=1712816619" },
  { id:"ntorq", name:"TVS NTORQ", img:"https://shop.tvsmotor.com/cdn/shop/files/Ntorq_290x_c95eced3-bdfa-4f39-a667-e0624ac342ea.png?v=1712821438" }
];

const CUSTOMER_REVIEWS = [
  { name:"Arjun M.", rating:5, text:"Premium leather seat cover fits perfectly. Installation was easy and the finish looks factory-grade.", product:"Premium Leather Seat Cover Set" },
  { name:"Priya K.", rating:5, text:"LED headlight bulbs are extremely bright. Night visibility improved a lot on highway rides.", product:"LED Headlight Bulbs H4 Pair" },
  { name:"Rohit D.", rating:4, text:"Dashcam quality is excellent. WiFi transfer and parking mode work smoothly.", product:"4K Dashcam with Night Vision" },
  { name:"Sneha R.", rating:5, text:"All-weather floor mats trap mud and water well. Very easy to clean after monsoon rides.", product:"All-Weather TPE Floor Mats" }
];

const MERCH_CATEGORIES = [
  { name:"HELMETS", slug:"helmets", img:"https://shop.tvsmotor.com/cdn/shop/files/Helmetmenu.jpg?v=1773136880" },
  { name:"URBAN WEAR", slug:"urban", img:"https://shop.tvsmotor.com/cdn/shop/files/Home_Page_Antimatter.png?v=1768369528" },
  { name:"RIDING GEAR", slug:"riding", img:"https://shop.tvsmotor.com/cdn/shop/files/Silk_Route_Helmet_Desktop.png?v=1773137631" }
];

const MERCH_PRODUCTS = [
  { id:101, name:"TVS Helmet Interior Cleaner (110 ml) (Pack of 2)", category:"Helmets", merchCat:"helmets", price:2.20, old:2.76, img:"https://shop.tvsmotor.com/cdn/shop/files/Helmetmenu.jpg?v=1773136880", rating:4.6, reviews:14, soldOut:true,
    desc:"Helmet interior cleaner spray for fresh and hygienic helmet lining. Pack of 2 x 110 ml.",
    specs:{Volume:"110 ml x 2",Type:"Spray Cleaner",Use:"Helmet Interior",Pack:"Pack of 2"}},
  { id:102, name:"TVS Polo T Shirt With Collar (Black)", category:"Helmets", merchCat:"urban", price:1.69, old:2.11, img:"https://shop.tvsmotor.com/cdn/shop/files/Home_Page_Antimatter.png?v=1768369528", rating:4.5, reviews:8, selectSize:true,
    desc:"Premium cotton polo with TVS branding. Comfortable fit for everyday urban wear.",
    specs:{Material:"Cotton",Fit:"Regular",Color:"Black",Sizes:"S–XXL"}},
  { id:103, name:"TVS Logo Cap With Flap (Black)", category:"Helmets", merchCat:"urban", price:0.36, old:0.42, img:"images/p6.jpg", rating:4.3, reviews:22, soldOut:true,
    desc:"Adjustable cap with TVS logo and neck flap for sun protection.",
    specs:{Material:"Cotton Blend",Color:"Black",Closure:"Adjustable",Style:"Cap with Flap"}},
  { id:104, name:"TVS Smart Polo With Zipper (Black)", category:"Helmets", merchCat:"urban", price:1.72, old:2.15, img:"https://shop.tvsmotor.com/cdn/shop/files/Home_Page_Antimatter.png?v=1768369528", rating:4.7, reviews:19,
    desc:"Smart polo with front zipper and TVS Racing inspired design.",
    specs:{Material:"Poly-Cotton",Color:"Black",Feature:"Front Zipper",Fit:"Slim"}},
  { id:105, name:"ASTRIDE Jockstrap (Black)", category:"Helmets", merchCat:"riding", price:0.49, old:0.55, img:"images/p6.jpg", rating:4.2, reviews:6, soldOut:true, notify:true,
    desc:"Performance jockstrap for riding comfort and support.",
    specs:{Material:"Elastic Blend",Color:"Black",Use:"Riding Gear",Fit:"Universal"}},
  { id:106, name:"Men Cotton T Shirt (Black)", category:"Helmets", merchCat:"urban", price:0.84, img:"images/p1.jpg", rating:4.4, reviews:31,
    desc:"Classic crew neck cotton tee with subtle TVS branding.",
    specs:{Material:"100% Cotton",Color:"Black",Fit:"Regular",Care:"Machine Wash"}},
  { id:107, name:"TVS Racing Riding Jacket", category:"Helmets", merchCat:"riding", price:4.82, old:6.02, img:"https://shop.tvsmotor.com/cdn/shop/files/Silk_Route_Helmet_Desktop.png?v=1773137631", rating:4.8, reviews:45, tag:"BESTSELLER",
    desc:"All-weather riding jacket with CE-certified protection and TVS Racing graphics.",
    specs:{Material:"Mesh + Polyester",Protection:"CE Level 1",Color:"Black/Red",Season:"All Season"}},
  { id:108, name:"TVS Full Face Helmet — Silk Route", category:"Helmets", merchCat:"helmets", price:8.43, old:10.84, img:"https://shop.tvsmotor.com/cdn/shop/files/Silk_Route_Helmet_Desktop.png?v=1773137631", rating:4.9, reviews:128, tag:"NEW",
    desc:"ISI-certified full face helmet with advanced ventilation and clear visor.",
    specs:{Certification:"ISI",Type:"Full Face",Visor:"Clear Anti-Scratch",Weight:"1.2 kg"}}
];

const HELMET_SEO_LINKS = [
  "Helmets under 1000","Helmets under 2000","Helmets under 3000","Helmets under 5000",
  "Helmets under 6000","Helmets under 7000","Helmets under 8000","Helmets under 9000",
  "Helmets under 10000","Helmets under 11000","Helmets under 12000","Helmets under 13000",
  "Helmets under 14000","Helmets under 15000","Helmets under 16000","Helmets under 17000",
  "Helmets under 18000","Helmets under 19000","Helmets under 20000","Men Helmet","Women Helmet"
];

PRODUCTS.push(...MERCH_PRODUCTS);

const KIDS_VARIANTS = [
  { color:"Navy Blue", img:"https://shop.tvsmotor.com/cdn/shop/files/Home_Page_Antimatter.png?v=1768369528" },
  { color:"White", img:"https://shop.tvsmotor.com/cdn/shop/files/Silk_Route_Helmet_Desktop.png?v=1773137631" },
  { color:"Yellow", img:"https://shop.tvsmotor.com/cdn/shop/files/Helmetmenu.jpg?v=1773136880" },
  { color:"Pink", img:"images/p6.jpg" }
];

function buildKidsProducts(baseId, name, type, price, oldPrice, reviews){
  return KIDS_VARIANTS.map((v, i) => ({
    id: baseId + i,
    name,
    variant: v.color,
    category: "Kids",
    kidsType: type,
    price,
    old: oldPrice,
    img: v.img,
    rating: reviews ? 5 : 4.8,
    reviews: reviews || 0,
    size: "One size",
    selectSize: true,
    desc: `${name} in ${v.color}. Soft, breathable fabric designed exclusively for kids.`,
    specs: { Material: "Cotton Blend", Color: v.color, Size: "One size", Age: "4–12 years", Care: "Machine wash cold" }
  }));
}

const KIDS_PRODUCTS = [
  ...buildKidsProducts(201, "TVS Skull Cap for Kids", "cap", 4.77, 5.30, 1),
  ...buildKidsProducts(205, "TVS Neck Gaiter | Exclusive for Kids", "gaiter", 5.00, 5.55, 0),
  ...buildKidsProducts(209, "TVS Arm sleeve - Exclusive for Kids", "sleeve", 5.30, 5.89, 0)
];

PRODUCTS.push(...KIDS_PRODUCTS);

const PROTECTION_PRODUCTS = [
  { id:301, name:"TVS JUPITER CRASH GUARD KIT", category:"Exterior", shopSlug:"crash-guards", price:89.99, old:109.99, img:"images/p2.jpg", rating:4.8, reviews:156, tag:"BESTSELLER",
    desc:"Heavy-duty crash guard kit engineered for TVS Jupiter. Impact-resistant steel with anti-corrosion finish.",
    specs:{Material:"Steel Alloy",Fit:"TVS Jupiter",Finish:"Matte Black",Warranty:"1 Year"}},
  { id:302, name:"TVS JUPITER FRONT GUARD", category:"Exterior", shopSlug:"crash-guards", price:54.99, old:64.99, img:"images/p2.jpg", rating:4.7, reviews:89,
    desc:"Front protection guard for daily commute safety and enhanced scooter aesthetics.",
    specs:{Material:"Steel",Fit:"TVS Jupiter",Type:"Front Guard",Color:"Black"}},
  { id:303, name:"TVS NTORQ BODY COVER", category:"Exterior", shopSlug:"crash-guards", price:42.99, old:49.99, img:"images/p7.jpg", rating:4.5, reviews:67,
    desc:"All-weather body cover with UV protection and water-resistant coating.",
    specs:{Material:"Polyester",Fit:"TVS NTORQ",Feature:"Water Resistant",Color:"Grey"}},
  { id:304, name:"TVS RAIDER SEAT COVER PRO", category:"Interior", shopSlug:"seat-covers", price:34.99, old:44.99, img:"images/p1.jpg", rating:4.6, reviews:112,
    desc:"Premium seat cover with anti-slip base and easy installation for TVS Raider.",
    specs:{Material:"Leatherette",Fit:"TVS Raider",Color:"Black",Warranty:"6 Months"}}
];

PRODUCTS.push(...PROTECTION_PRODUCTS);

function buildModelAccessories(){
  const types = [
    { name:"Scooter Cover", img:"images/p7.jpg", price:54.99, old:64.99, category:"Exterior" },
    { name:"Floor Mat Set", img:"images/p8.jpg", price:79.99, old:99.99, category:"Interior" },
    { name:"LED Headlight Bulbs Pair", img:"images/p3.jpg", price:49.99, old:69.99, category:"Lighting", tag:"-30%" },
    { name:"Mobile Charger", img:"images/p4.jpg", price:32.99, old:39.99, category:"Electronics" },
    { name:"Crash Guard Kit", img:"images/p2.jpg", price:89.99, old:109.99, category:"Exterior", tag:"BESTSELLER" },
    { name:"Seat Cover Pro", img:"images/p1.jpg", price:34.99, old:44.99, category:"Interior" },
    { name:"Dashcam WiFi", img:"images/p5.jpg", price:99.99, old:139.99, category:"Electronics", tag:"HOT" },
    { name:"Top Box Mount Kit", img:"images/p7.jpg", price:120.00, old:149.00, category:"Exterior", tag:"NEW" }
  ];
  let id = 401;
  const items = [];
  VEHICLE_MODELS.forEach(m => {
    types.forEach(t => {
      items.push({
        id: id++,
        name: `${m.name} ${t.name}`,
        modelId: m.id,
        category: t.category,
        price: t.price,
        old: t.old,
        img: t.img,
        tag: t.tag,
        rating: +(4.3 + ((id % 7) * 0.1)).toFixed(1),
        reviews: 15 + ((id * 13) % 180),
        desc: `Genuine TVS ${t.name.toLowerCase()} designed for ${m.name}. Perfect fit guaranteed.`,
        specs: { Fit: m.name, Type: t.name, Brand: "TVS Genuine Parts" }
      });
    });
  });
  return items;
}

const MODEL_ACCESSORIES = buildModelAccessories();
PRODUCTS.push(...MODEL_ACCESSORIES);

const CATEGORY_FAQS = [
  { q:"Are TVS genuine accessories compatible with all models?", a:"Genuine TVS accessories are designed for specific models. Check product compatibility on the detail page or filter by your vehicle model above." },
  { q:"Do crash guards affect mileage or handling?", a:"OEM-fit guards are weight-optimized and tested to maintain handling characteristics while adding protection." },
  { q:"What is the warranty on protection accessories?", a:"Most protection parts include a 6–12 month manufacturer warranty against defects. See individual product pages for details." },
  { q:"How do I install scooter guards at home?", a:"Installation kits include mounting hardware and instructions. Authorized TVS service centres also offer fitment support." }
];

function titleCase(str){
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

const CATEGORY_REGISTRY = {};
SHOP_CATEGORIES.forEach(c => {
  CATEGORY_REGISTRY[c.slug] = {
    slug: c.slug,
    title: c.name,
    source: "accessories",
    filterCat: c.cat,
    heroImg: c.img,
    heroHeadline: `Impact-Proof your ride with TVS ${c.name}`,
    seoHeading: `TVS ${c.name} That Keeps You Covered, Whenever You Go`,
    navActive: "accessories"
  };
});
MERCH_CATEGORIES.forEach(c => {
  CATEGORY_REGISTRY[c.slug] = {
    slug: c.slug,
    title: titleCase(c.name),
    source: "merch",
    merchCat: c.slug,
    heroImg: c.img,
    heroHeadline: `Shop genuine TVS ${titleCase(c.name)}`,
    seoHeading: `TVS ${titleCase(c.name)} — Quality You Can Trust`,
    navActive: "merchandise"
  };
});
