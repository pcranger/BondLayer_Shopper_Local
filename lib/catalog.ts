export type RetailerId = "northstar" | "directmart" | "techhaven";

export type Retailer = {
  id: RetailerId;
  name: string;
  shortName: string;
  tagline: string;
  colour: string;
  softColour: string;
  memberLabel?: string;
};

export type Offer = {
  retailerId: RetailerId;
  price: number;
  delivery: number;
  stock: string;
  deliveryLabel: string;
  pointsFaceValue?: number;
  returnCostAvoided?: number;
  retentionDiscount?: number;
  badge?: string;
  dealTags?: string[];
};

export type Product = {
  id: string;
  name: string;
  shortName: string;
  category: string;
  image: string;
  description: string;
  exactMatch: string;
  specs: string[];
  accent: string;
  offers: Offer[];
};

export const retailers: Retailer[] = [
  {
    id: "northstar",
    name: "Northstar",
    shortName: "N",
    tagline: "Your member retailer",
    colour: "#214b3f",
    softColour: "#e7f1ec",
    memberLabel: "Gold member",
  },
  {
    id: "directmart",
    name: "DirectMart",
    shortName: "D",
    tagline: "Low prices, delivered",
    colour: "#274d87",
    softColour: "#e9f0fb",
  },
  {
    id: "techhaven",
    name: "TechHaven",
    shortName: "T",
    tagline: "Independent tech specialists",
    colour: "#8b4d32",
    softColour: "#f7ece5",
  },
];

export const products: Product[] = [
  {
    id: "iphone-pro-256",
    name: "Apple iPhone Pro 256GB",
    shortName: "iPhone Pro",
    category: "Phones",
    image: "/products/phone.png",
    description:
      "A premium unlocked smartphone, compared as one exact 256GB Australian model.",
    exactMatch: "New - Unlocked - 256GB - Australian stock",
    specs: ["6.3-inch display", "256GB storage", "Unlocked", "2-year local warranty"],
    accent: "#dce7ee",
    offers: [
      {
        retailerId: "northstar",
        price: 1789,
        delivery: 0,
        stock: "In stock",
        deliveryLabel: "Free next-day delivery",
        pointsFaceValue: 20,
        returnCostAvoided: 12,
        retentionDiscount: 90,
        badge: "Gold benefits",
        dealTags: [
          "A$20 points value",
          "A$12 returns value",
          "Ask for A$90 private discount",
          "Add AirPods: save A$79",
        ],
      },
      {
        retailerId: "directmart",
        price: 1749,
        delivery: 0,
        stock: "In stock",
        deliveryLabel: "Free 2-3 day delivery",
        badge: "Lowest cash price",
        dealTags: [
          "A$40 instant markdown",
          "5% app coupon capped at A$60",
          "Free delivery",
        ],
      },
      {
        retailerId: "techhaven",
        price: 1739,
        delivery: 10,
        stock: "Only 4 left",
        deliveryLabel: "$10 standard delivery",
        dealTags: [
          "A$50 new-customer code",
          "Phone case bundle: save A$29",
          "A$10 delivery",
        ],
      },
    ],
  },
  {
    id: "cloud-headphones",
    name: "CloudSound Studio Headphones",
    shortName: "Studio Headphones",
    category: "Audio",
    image: "/products/headphones.png",
    description:
      "Comfortable wireless over-ear headphones with active noise cancellation.",
    exactMatch: "New - Charcoal - Australian stock",
    specs: ["Active noise cancellation", "38-hour battery", "USB-C", "Travel case"],
    accent: "#dce9df",
    offers: [
      {
        retailerId: "northstar",
        price: 549,
        delivery: 0,
        stock: "In stock",
        deliveryLabel: "Free next-day delivery",
        pointsFaceValue: 12,
        returnCostAvoided: 12,
        retentionDiscount: 45,
        badge: "Gold benefits",
        dealTags: [
          "A$12 points value",
          "A$12 returns value",
          "Ask for A$45 private discount",
          "Buy 2nd pair: 20% off",
        ],
      },
      {
        retailerId: "directmart",
        price: 519,
        delivery: 0,
        stock: "In stock",
        deliveryLabel: "Free 2-3 day delivery",
        badge: "Lowest cash price",
        dealTags: [
          "A$30 instant markdown",
          "A$25 case bundle credit",
          "Free delivery",
        ],
      },
      {
        retailerId: "techhaven",
        price: 509,
        delivery: 14,
        stock: "In stock",
        deliveryLabel: "$14 express delivery",
        dealTags: [
          "A$40 new-customer code",
          "15% off cable bundle",
          "A$14 express delivery",
        ],
      },
    ],
  },
  {
    id: "runner-pro",
    name: "Runner Pro Everyday Shoe",
    shortName: "Runner Pro",
    category: "Footwear",
    image: "/products/shoe.png",
    description:
      "A lightweight everyday running shoe with responsive cushioning.",
    exactMatch: "New - Cream/Cobalt - Size 10",
    specs: ["Size 10", "Neutral support", "Everyday cushioning", "30-day returns"],
    accent: "#f4dfd4",
    offers: [
      {
        retailerId: "northstar",
        price: 199,
        delivery: 0,
        stock: "In stock",
        deliveryLabel: "Free next-day delivery",
        pointsFaceValue: 6,
        returnCostAvoided: 12,
        retentionDiscount: 25,
        badge: "Gold benefits",
        dealTags: [
          "A$6 points value",
          "A$12 returns value",
          "Ask for A$25 private discount",
          "Buy socks: 50% off",
        ],
      },
      {
        retailerId: "directmart",
        price: 179,
        delivery: 8,
        stock: "In stock",
        deliveryLabel: "$8 standard delivery",
        badge: "Lowest cash price",
        dealTags: [
          "A$20 weekend markdown",
          "10% app coupon capped at A$18",
          "A$8 delivery",
        ],
      },
      {
        retailerId: "techhaven",
        price: 189,
        delivery: 0,
        stock: "In stock",
        deliveryLabel: "Free standard delivery",
        dealTags: [
          "A$10 checkout code",
          "Buy socks: 30% off",
          "Free delivery",
        ],
      },
    ],
  },
];

export const money = (value: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

export function retailerById(id: RetailerId) {
  return retailers.find((retailer) => retailer.id === id)!;
}

export function matchProduct(message: string) {
  const query = message.toLowerCase();
  if (query.includes("headphone") || query.includes("audio")) return products[1];
  if (
    query.includes("shoe") ||
    query.includes("runner") ||
    query.includes("running")
  )
    return products[2];
  return products[0];
}
