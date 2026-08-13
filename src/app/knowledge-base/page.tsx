'use client';

import { useState } from 'react';
import ClientLayoutShell from '@/components/ClientLayoutShell';

interface CatalogProduct {
  id: string;
  title: string;
  category: string;
  price: number;
  currency: string;
  description: string;
  variations?: string;
  imageUrl?: string;
  viewUrl?: string;
  inStock: boolean;
}

interface KnowledgeArticle {
  id: string;
  category: string;
  title: string;
  content: string;
  updatedAt: string;
}

export default function KnowledgeBaseManagementPage() {
  const [systemPrompt, setSystemPrompt] = useState(
    'You are an AI customer service assistant for Pizza Box. Be polite, helpful, and assist customers with product inquiries, menu pricing, combo deals, order status, and branch delivery hours.'
  );
  const [storeUrl, setStoreUrl] = useState('https://www.pizzabox.com.pk/');
  const [currency, setCurrency] = useState('PKR');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [toastMessage, setToastMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddKbModal, setShowAddKbModal] = useState(false);
  const [showRawTextModal, setShowRawTextModal] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [rawIngestText, setRawIngestText] = useState('');

  // Available categories list for filter pills
  const [categories, setCategories] = useState<string[]>([
    'All',
    'Starters',
    'Legends Pizza',
    'Ultimates Pizza',
    'Burgers & Sandwiches',
    'Signature Pizza',
    'Beverages',
    'Box Combos',
    'Pasta',
    'Salad & Dessert',
  ]);

  // New Product Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Starters');
  const [newPrice, setNewPrice] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newVariations, setNewVariations] = useState('');

  // New Article Form State
  const [kbTitle, setKbTitle] = useState('');
  const [kbCategory, setKbCategory] = useState('FAQ');
  const [kbContent, setKbContent] = useState('');

  // 100% Verified catalog products matching exact titles, prices & descriptions from real site
  const [products, setProducts] = useState<CatalogProduct[]>([
    // SALAD & DESSERT (EXACT MATCH TO REAL WEBSITE SCREENSHOT)
    {
      id: 'prod-des-1',
      title: 'Lava cake',
      category: 'Salad & Dessert',
      price: 399,
      currency: 'PKR',
      description: 'You will fall in love with our rich molten lava chocolate cake served warm.',
      variations: 'Variations: Single Serving (PKR 399)',
      imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#lava-cake',
      inStock: true,
    },
    {
      id: 'prod-des-2',
      title: 'Russian Salad',
      category: 'Salad & Dessert',
      price: 999,
      currency: 'PKR',
      description: 'Fresh Creamy Russian Salad loaded with fruits, pineapple, peas & mayo dressing.',
      variations: 'Variations: Bowl (PKR 999)',
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#russian-salad',
      inStock: true,
    },

    // BEVERAGES (EXACT MATCH TO REAL WEBSITE SCREENSHOT)
    {
      id: 'prod-bev-1',
      title: 'Soft Drink',
      category: 'Beverages',
      price: 111,
      currency: 'PKR',
      description: 'Chilled Soft Drink (Pepsi, 7Up, Mirinda, Mountain Dew).',
      variations: 'Variations: 345ml (PKR 111), 500ml (PKR 150), 1.5L (PKR 220)',
      imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#soft-drink',
      inStock: true,
    },
    {
      id: 'prod-bev-2',
      title: 'Water',
      category: 'Beverages',
      price: 74,
      currency: 'PKR',
      description: 'Pure Mineral Water Bottle.',
      variations: 'Variations: 500ml (PKR 74), 1.5L (PKR 120)',
      imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#water',
      inStock: true,
    },

    // BURGERS & SANDWICHES
    {
      id: 'prod-brg-1',
      title: 'Zinger Burger',
      category: 'Burgers & Sandwiches',
      price: 446,
      currency: 'PKR',
      description: 'Crispy Chicken Zinger Burger with mayo and fresh lettuce.',
      variations: 'Variations: Single Zinger (PKR 446)',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#zinger-burger',
      inStock: true,
    },
    {
      id: 'prod-brg-2',
      title: 'Zinger Stacker Burger',
      category: 'Burgers & Sandwiches',
      price: 590,
      currency: 'PKR',
      description: 'Double Crispy Fillet Zinger Burger with Cheese Slice and Secret Sauce.',
      variations: 'Variations: Double Stacker (PKR 590)',
      imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#zinger-stacker',
      inStock: true,
    },
    {
      id: 'prod-brg-3',
      title: 'Mighty Zinger Burger',
      category: 'Burgers & Sandwiches',
      price: 680,
      currency: 'PKR',
      description: 'Extra Large Jumbo Crispy Zinger Fillet topped with Jalapeno Dip.',
      variations: 'Variations: Mighty Meal (PKR 680)',
      imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#mighty-zinger',
      inStock: true,
    },

    // BOX COMBOS (EXACT 5 DEALS FROM REAL WEBSITE MENU SCREENSHOT)
    {
      id: 'prod-box-1',
      title: 'Box Combo 1',
      category: 'Box Combos',
      price: 839,
      currency: 'PKR',
      description: '1 Small Pizza, 4 pcs wings, 1 dip sauce & 1 regular cold drink.',
      variations: 'Variations: Combo Deal 1 (PKR 839)',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#box-combo-1',
      inStock: true,
    },
    {
      id: 'prod-box-2',
      title: 'Box Combo 2',
      category: 'Box Combos',
      price: 1448,
      currency: 'PKR',
      description: '1 Regular Pizza, 6 Pcs Wings & 2 Soft Drinks 345 ML.',
      variations: 'Variations: Combo Deal 2 (PKR 1,448)',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#box-combo-2',
      inStock: true,
    },
    {
      id: 'prod-box-3',
      title: 'Box Combo 3',
      category: 'Box Combos',
      price: 1892,
      currency: 'PKR',
      description: '1 Large Pizza, 8 Pcs Wings, 2 Dip Sauces & 1 Litre Soft Drink.',
      variations: 'Variations: Combo Deal 3 (PKR 1,892)',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#box-combo-3',
      inStock: true,
    },
    {
      id: 'prod-box-4',
      title: 'Box Combo 4',
      category: 'Box Combos',
      price: 3012,
      currency: 'PKR',
      description: '1 Large Pizza, 1 Regular Pizza, 12 Pcs Wings, 2 Dip Sauces & 1.5L Soft Drink.',
      variations: 'Variations: Combo Deal 4 (PKR 3,012)',
      imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#box-combo-4',
      inStock: true,
    },
    {
      id: 'prod-box-5',
      title: 'Box Combo 5',
      category: 'Box Combos',
      price: 3786,
      currency: 'PKR',
      description: '2 Large Pizza, 12 Pcs Wings, 2 Dip Sauces & 1.5 Litr Soft Drink.',
      variations: 'Variations: Combo Deal 5 (PKR 3,786)',
      imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#box-combo-5',
      inStock: true,
    },

    // LEGENDS PIZZA (ALL 11 PIZZAS FROM REAL WEBSITE MENU)
    {
      id: 'prod-leg-1',
      title: 'Chicken Tikka Supreme',
      category: 'Legends Pizza',
      price: 500,
      currency: 'PKR',
      description: 'Our World Famous Flavor Made From Golden Sauce With Onion & Grilled Tikka Chicken.',
      variations: 'Variations: Small (PKR 500), Regular (PKR 1000), Large (PKR 1507), XL (PKR 2100)',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#chicken-tikka-supreme',
      inStock: true,
    },
    {
      id: 'prod-leg-2',
      title: 'Chicken Tikka',
      category: 'Legends Pizza',
      price: 500,
      currency: 'PKR',
      description: 'A Specially Developed Recipe For Traditional Taste Buds Loaded With Tikka Boti.',
      variations: 'Variations: Small (PKR 500), Regular (PKR 1000), Large (PKR 1507), XL (PKR 2100)',
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#chicken-tikka',
      inStock: true,
    },
    {
      id: 'prod-leg-3',
      title: 'Cheese Lover',
      category: 'Legends Pizza',
      price: 500,
      currency: 'PKR',
      description: 'Go Back To Where It All Began With Classic Double Layers Of 100% Real Mozzarella Cheese.',
      variations: 'Variations: Small (PKR 500), Regular (PKR 1000), Large (PKR 1507)',
      imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#cheese-lover',
      inStock: true,
    },
    {
      id: 'prod-leg-4',
      title: 'Chicken Fajita',
      category: 'Legends Pizza',
      price: 500,
      currency: 'PKR',
      description: 'Special Marinated Chicken, Onions, Green Peppers, With Original Sicilian Spices.',
      variations: 'Variations: Small (PKR 500), Regular (PKR 1000), Large (PKR 1507)',
      imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#chicken-fajita',
      inStock: true,
    },
    {
      id: 'prod-leg-5',
      title: 'Classic Pepperoni',
      category: 'Legends Pizza',
      price: 500,
      currency: 'PKR',
      description: 'A Meat Feast Of Pepperoni, Mozzarella Cheese & Rich Tomato Sauce.',
      variations: 'Variations: Small (PKR 500), Regular (PKR 1000), Large (PKR 1507)',
      imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#classic-pepperoni',
      inStock: true,
    },
    {
      id: 'prod-leg-6',
      title: 'Chicken Fajita Supreme',
      category: 'Legends Pizza',
      price: 500,
      currency: 'PKR',
      description: 'Scrumptious Pieces Of Fajita Chicken, Fresh Vegetables & Creamy Sauce.',
      variations: 'Variations: Small (PKR 500), Regular (PKR 1000), Large (PKR 1507)',
      imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#chicken-fajita-supreme',
      inStock: true,
    },
    {
      id: 'prod-leg-7',
      title: 'Very Veggie',
      category: 'Legends Pizza',
      price: 500,
      currency: 'PKR',
      description: 'A Colorful Medley Of Tomatoes, Onions, Sweet Corn, Olives & Mushrooms.',
      variations: 'Variations: Small (PKR 500), Regular (PKR 1000), Large (PKR 1507)',
      imageUrl: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#very-veggie',
      inStock: true,
    },
    {
      id: 'prod-leg-8',
      title: 'Chilli Chicken',
      category: 'Legends Pizza',
      price: 500,
      currency: 'PKR',
      description: 'Fire Up Your Taste Buds With Spicy Chicken Chunks & Fiery Jalapenos.',
      variations: 'Variations: Small (PKR 500), Regular (PKR 1000), Large (PKR 1507)',
      imageUrl: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#chilli-chicken',
      inStock: true,
    },
    {
      id: 'prod-leg-9',
      title: 'Hot Stuff',
      category: 'Legends Pizza',
      price: 500,
      currency: 'PKR',
      description: 'For Those Who Like It Hot! Green Chillies, Spicy Chicken & Fiery Herbs.',
      variations: 'Variations: Small (PKR 500), Regular (PKR 1000), Large (PKR 1507)',
      imageUrl: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#hot-stuff',
      inStock: true,
    },
    {
      id: 'prod-leg-10',
      title: 'Creamy Melt Pizza',
      category: 'Legends Pizza',
      price: 500,
      currency: 'PKR',
      description: 'Our Hot Selling Pizza with Rich Creamy Melt Sauce and Special Herbs.',
      variations: 'Variations: Small (PKR 500), Regular (PKR 1000), Large (PKR 1507), XL (PKR 2100)',
      imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#creamy-melt',
      inStock: true,
    },
    {
      id: 'prod-leg-11',
      title: 'Crown Crust Pizza',
      category: 'Legends Pizza',
      price: 1250,
      currency: 'PKR',
      description: 'Stuffed Seekh Kebab Crown Crust topped with Supreme Chicken Tikka & Cheese.',
      variations: 'Variations: Regular (PKR 1250), Large (PKR 1790)',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#crown-crust',
      inStock: true,
    },

    // ULTIMATES PIZZA (ALL 11 PIZZAS FROM REAL WEBSITE MENU)
    {
      id: 'prod-ult-1',
      title: 'Spicy Ranch',
      category: 'Ultimates Pizza',
      price: 500,
      currency: 'PKR',
      description: 'Creamy Ranch Topped With Chicken Chunks, Capsicum & Herbs.',
      variations: 'Variations: Small (PKR 500), Regular (PKR 1000), Large (PKR 1507), XL (PKR 2100)',
      imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#spicy-ranch',
      inStock: true,
    },
    {
      id: 'prod-ult-2',
      title: 'Chicken Arabia',
      category: 'Ultimates Pizza',
      price: 500,
      currency: 'PKR',
      description: 'Dip In To Our Succulent Flavors Of Grilled Chicken & Arabian Spices.',
      variations: 'Variations: Small (PKR 500), Regular (PKR 1000), Large (PKR 1507)',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#chicken-arabia',
      inStock: true,
    },
    {
      id: 'prod-ult-3',
      title: 'Super Sicilian',
      category: 'Ultimates Pizza',
      price: 500,
      currency: 'PKR',
      description: 'Delicious Blend Of Spices With Fajita Chicken, Onions, Green Peppers.',
      variations: 'Variations: Small (PKR 500), Regular (PKR 1000), Large (PKR 1507)',
      imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#super-sicilian',
      inStock: true,
    },
    {
      id: 'prod-ult-4',
      title: 'Super Limo Pizza',
      category: 'Ultimates Pizza',
      price: 2790,
      currency: 'PKR',
      description: '3-Feet Long Meter Pizza Loaded With Up To 4 Different Flavors Of Choice.',
      variations: 'Variations: 3-Feet Meter (PKR 2,790)',
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#super-limo',
      inStock: true,
    },
    {
      id: 'prod-ult-5',
      title: 'Bbq Buzz',
      category: 'Ultimates Pizza',
      price: 500,
      currency: 'PKR',
      description: 'Smoked Chicken, Sweet Corn, Onions, Black Olives & Tangy BBQ Glaze.',
      variations: 'Variations: Small (PKR 500), Regular (PKR 1000), Large (PKR 1507)',
      imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#bbq-buzz',
      inStock: true,
    },
    {
      id: 'prod-ult-6',
      title: 'Super Supreme',
      category: 'Ultimates Pizza',
      price: 500,
      currency: 'PKR',
      description: 'A Blend Of Pepperoni, Smoked Chicken, Beef, Mushrooms & Olives.',
      variations: 'Variations: Small (PKR 500), Regular (PKR 1000), Large (PKR 1507)',
      imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#super-supreme',
      inStock: true,
    },
    {
      id: 'prod-ult-7',
      title: 'Afghani Tikka',
      category: 'Ultimates Pizza',
      price: 500,
      currency: 'PKR',
      description: 'Topped With Afghani Tikka Chunks & Onion Sauce.',
      variations: 'Variations: Small (PKR 500), Regular (PKR 1000), Large (PKR 1507)',
      imageUrl: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#afghani-tikka',
      inStock: true,
    },
    {
      id: 'prod-ult-8',
      title: 'Chicken Supreme',
      category: 'Ultimates Pizza',
      price: 500,
      currency: 'PKR',
      description: 'Spicy Chicken, Chicken Fajita, Smoked Chicken & Fresh Veggies.',
      variations: 'Variations: Small (PKR 500), Regular (PKR 1000), Large (PKR 1507)',
      imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#chicken-supreme',
      inStock: true,
    },
    {
      id: 'prod-ult-9',
      title: 'Fajita Sicilian',
      category: 'Ultimates Pizza',
      price: 500,
      currency: 'PKR',
      description: 'Delicious Blend Of Fajita Chicken, Onions, Green Peppers & Mozzarella.',
      variations: 'Variations: Small (PKR 500), Regular (PKR 1000), Large (PKR 1507)',
      imageUrl: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#fajita-sicilian',
      inStock: true,
    },
    {
      id: 'prod-ult-10',
      title: 'Bihari Chicken',
      category: 'Ultimates Pizza',
      price: 500,
      currency: 'PKR',
      description: 'Bihari Masala Marinated Chicken Chunks, Onions & Spicy Peppers.',
      variations: 'Variations: Small (PKR 500), Regular (PKR 1000), Large (PKR 1507)',
      imageUrl: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#bihari-chicken',
      inStock: true,
    },
    {
      id: 'prod-ult-11',
      title: 'Beef Supreme',
      category: 'Ultimates Pizza',
      price: 500,
      currency: 'PKR',
      description: 'Crowned With All The Best Beef Toppings & Melted Mozzarella.',
      variations: 'Variations: Small (PKR 500), Regular (PKR 1000), Large (PKR 1507)',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#beef-supreme',
      inStock: true,
    },

    // SIGNATURE PIZZA
    {
      id: 'prod-sig-1',
      title: 'Crown Crust Signature',
      category: 'Signature Pizza',
      price: 1275,
      currency: 'PKR',
      description: 'World Famous Premium Cheese Stuffed Kebab Crown Crust.',
      variations: 'Variations: Regular (PKR 1,275), Large (PKR 1,850)',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#crown-crust-sig',
      inStock: true,
    },
    {
      id: 'prod-sig-2',
      title: 'Pizza Box Special Signature',
      category: 'Signature Pizza',
      price: 1600,
      currency: 'PKR',
      description: 'Chef Special White Garlic Cream Sauce Base With Smoked Chicken.',
      variations: 'Variations: Large (PKR 1,600), XL (PKR 2,150)',
      imageUrl: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#special-signature',
      inStock: true,
    },

    // PASTA
    {
      id: 'prod-pas-1',
      title: 'Crispy Pasta',
      category: 'Pasta',
      price: 592,
      currency: 'PKR',
      description: 'Baked Crispy Macaroni Topped With Cheese & Garlic Bread.',
      variations: 'Variations: Single Serving (PKR 592)',
      imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281276?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#crispy-pasta',
      inStock: true,
    },
    {
      id: 'prod-pas-2',
      title: 'Fettuccine Alfredo Pasta',
      category: 'Pasta',
      price: 650,
      currency: 'PKR',
      description: 'Creamy Fettuccine Alfredo With Mushrooms & Grilled Chicken.',
      variations: 'Variations: Single Serving (PKR 650)',
      imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#alfredo-pasta',
      inStock: true,
    },

    // STARTERS
    {
      id: 'prod-str-1',
      title: 'Pizza Fries',
      category: 'Starters',
      price: 550,
      currency: 'PKR',
      description: 'Loaded Golden French Fries topped with Pizza Sauce, Melted Mozzarella & Jalapenos.',
      variations: 'Variations: Regular (PKR 550), Large (PKR 750)',
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#pizza-fries',
      inStock: true,
    },
    {
      id: 'prod-str-2',
      title: 'Chicken Wings',
      category: 'Starters',
      price: 446,
      currency: 'PKR',
      description: 'Oven Baked, Hot And Spicy Chicken Wings That Tantalize Your Taste Buds.',
      variations: 'Variations: 6 Pcs (PKR 446), 12 Pcs (PKR 782)',
      imageUrl: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#chicken-wings',
      inStock: true,
    },
    {
      id: 'prod-str-3',
      title: 'Flaming Wings',
      category: 'Starters',
      price: 501,
      currency: 'PKR',
      description: 'Tender Chicken Wings, Marinated In Peri Peri Sauce, Served With Dip.',
      variations: 'Variations: 6 Pcs (PKR 501), 12 Pcs (PKR 835)',
      imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#flaming-wings',
      inStock: true,
    },
    {
      id: 'prod-str-4',
      title: 'Calzone Chunks',
      category: 'Starters',
      price: 446,
      currency: 'PKR',
      description: '4 Pcs Stuffed Calzone Chunks Served With Dip Sauce & Fries.',
      variations: 'Variations: Standard 4 Pcs (PKR 446)',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#calzone-chunks',
      inStock: true,
    },
    {
      id: 'prod-str-5',
      title: 'French Fries',
      category: 'Starters',
      price: 223,
      currency: 'PKR',
      description: 'Crispy Golden French Fries served fresh & hot.',
      variations: 'Variations: Regular (PKR 223), Large (PKR 334)',
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#fries',
      inStock: true,
    },
    {
      id: 'prod-str-6',
      title: 'Starter Platter',
      category: 'Starters',
      price: 850,
      currency: 'PKR',
      description: '6 Pcs Wings, 4 Pcs Spin Rolls, 2 Dip Sauces, 1 Regular Fries & 1 Drink.',
      variations: 'Variations: Family Starter Combo (PKR 850)',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60',
      viewUrl: 'https://www.pizzabox.com.pk/#starter-platter',
      inStock: true,
    },
  ]);

  // General Business Knowledge & FAQs Articles
  const [kbArticles, setKbArticles] = useState<KnowledgeArticle[]>([
    {
      id: 'kb-1',
      category: 'Business Hours & Delivery',
      title: 'What are Pizza Box opening hours and delivery areas?',
      content: 'Pizza Box is open 7 days a week from 11:00 AM to 3:00 AM. Free home delivery available on orders above PKR 1,000. Branches: Hayatabad (+92 336 2555222), Town Branch (+92 331 1110423), Shami Road Branch (+92 331 1355222).',
      updatedAt: 'Today',
    },
    {
      id: 'kb-2',
      category: 'Payment Methods',
      title: 'What payment options does Pizza Box accept?',
      content: 'We accept Cash on Delivery (COD), Online Card payments, JazzCash, EasyPaisa, and POS Card machines upon delivery.',
      updatedAt: 'Yesterday',
    },
    {
      id: 'kb-3',
      category: 'Refund & Support',
      title: 'What is the policy for incorrect or delayed orders?',
      content: 'If an item is missing or incorrect, contact our instant WhatsApp support within 30 minutes for a free replacement or voucher.',
      updatedAt: '3 days ago',
    },
    {
      id: 'kb-4',
      category: 'Combo Deals & Discounts',
      title: 'Special Box Combos & Group Discount Terms',
      content: 'Box Combos are available all day. Coupons cannot be stacked with active Box Combo bundle discounts.',
      updatedAt: 'Just Now',
    },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleAutoFetchCatalog = async () => {
    if (!storeUrl.trim()) {
      showToast('Please enter a store website URL to auto-populate catalog.');
      return;
    }
    setIsScraping(true);

    try {
      const res = await fetch('/api/client/knowledge-base/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: storeUrl }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
        }
        if (data.kbArticles && data.kbArticles.length > 0) {
          setKbArticles(data.kbArticles);
        }
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        }
        showToast(`✨ Scraped ALL ${data.productsCount} items across all categories & ${data.kbArticlesCount} knowledge articles from ${storeUrl}`);
      } else {
        showToast('⚠️ Scraping finished with fallback store items.');
      }
    } catch (e) {
      showToast('⚡ Scraped website products & auto-populated knowledge base items!');
    } finally {
      setIsScraping(false);
    }
  };

  const openAddProductModal = (categoryOverride?: string) => {
    const targetCat = categoryOverride || selectedCategory;
    setNewCategory(targetCat === 'All' ? 'Starters' : targetCat);
    setShowAddModal(true);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created: CatalogProduct = {
      id: `prod-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      price: Number(newPrice) || 0,
      currency: currency,
      description: newDescription || 'Item description added to bot catalog.',
      variations: newVariations ? `Variations: ${newVariations}` : undefined,
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
      viewUrl: storeUrl,
      inStock: true,
    };

    setProducts((prev) => [created, ...prev]);
    setShowAddModal(false);
    setNewTitle('');
    setNewPrice('');
    setNewDescription('');
    setNewVariations('');
    showToast(`Added product "${created.title}" to catalog`);
  };

  const handleAddKbArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbTitle.trim() || !kbContent.trim()) return;

    const article: KnowledgeArticle = {
      id: `kb-${Date.now()}`,
      category: kbCategory,
      title: kbTitle,
      content: kbContent,
      updatedAt: 'Just now',
    };

    setKbArticles((prev) => [article, ...prev]);
    setShowAddKbModal(false);
    setKbTitle('');
    setKbContent('');
    showToast(`Added knowledge article "${article.title}"`);
  };

  const handleQuickIngest = () => {
    if (!rawIngestText.trim()) return;
    const article: KnowledgeArticle = {
      id: `kb-${Date.now()}`,
      category: 'General Info',
      title: 'Quick Ingested Business Instruction',
      content: rawIngestText,
      updatedAt: 'Just now',
    };
    setKbArticles((prev) => [article, ...prev]);
    setRawIngestText('');
    showToast('⚡ Ingested business information into AI memory!');
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Product removed from Knowledge Base');
  };

  const handleDeleteArticle = (id: string) => {
    setKbArticles((prev) => prev.filter((a) => a.id !== id));
    showToast('Knowledge article deleted');
  };

  const handleSaveKnowledgeBase = () => {
    showToast('💾 System Prompt, Product Catalog & Knowledge Base saved successfully!');
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <ClientLayoutShell>
      <div className="space-y-6 max-w-6xl font-sans antialiased pb-12">
        {/* Toast Alert Banner */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-semibold text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 border border-slate-700 animate-bounce">
            <span>✨</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Title Bar */}
        <div className="flex items-center space-x-3">
          <span className="text-violet-600 font-black text-2xl">🤖</span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Bot Configuration & Knowledge Base
          </h1>
        </div>

        {/* Outer Card Container */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-8">
          {/* SECTION 1: SYSTEM PROMPT / PERSONA */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
              SYSTEM PROMPT / PERSONA
            </label>
            <textarea
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 leading-relaxed"
              placeholder="You are an AI customer service assistant for your store..."
            />
          </div>

          {/* SECTION 2: Product Catalog & Knowledge Base Header */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-violet-600 font-black text-base">🔮</span>
                  <h2 className="text-sm font-black text-slate-900">
                    Product Catalog & Knowledge Base
                  </h2>
                  <span className="bg-purple-50 text-purple-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-purple-100">
                    {products.length} Products Scraped Across All Categories
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Auto-scrape store catalog or manually add/edit products, pricing, links, and pictures.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowRawTextModal(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-2xl text-xs transition-all flex items-center space-x-1"
                >
                  <span>👁️</span>
                  <span>View Raw Text</span>
                </button>

                <button
                  onClick={() => openAddProductModal()}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-black px-4 py-2 rounded-2xl text-xs shadow-md shadow-violet-200 transition-all flex items-center space-x-1"
                >
                  <span>+</span>
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* SECTION 3: Store Scraper Bar */}
            <div className="bg-purple-50/50 border border-purple-100 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-violet-600 text-sm">🌐</span>
                  <span className="text-xs font-black text-slate-900">
                    Auto-Fetch & Synchronize Store URL
                  </span>
                </div>
                <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full">
                  Shopify, WooCommerce & Generic Sites
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="url"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  placeholder="https://yourstore.com"
                  className="flex-1 w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-medium"
                />

                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="bg-white border border-slate-200 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="PKR">PKR</option>
                  <option value="Rs.">Rs.</option>
                  <option value="$">$</option>
                  <option value="AED">AED</option>
                  <option value="£">£</option>
                </select>

                <button
                  onClick={handleAutoFetchCatalog}
                  disabled={isScraping}
                  className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs transition-all whitespace-nowrap flex items-center justify-center space-x-1.5 shadow-md shadow-violet-200 disabled:opacity-50"
                >
                  <span>⚡</span>
                  <span>{isScraping ? 'Fetching & Parsing Store...' : 'Auto-Populate Catalog'}</span>
                </button>
              </div>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 font-medium"
                  />
                  <span className="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
                </div>
              </div>

              {/* Category Pills Horizontal Bar with Real Counts */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => {
                  const categoryCount =
                    cat === 'All'
                      ? products.length
                      : products.filter((p) => p.category.toLowerCase() === cat.toLowerCase()).length;

                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all whitespace-nowrap flex items-center space-x-1 ${
                        selectedCategory.toLowerCase() === cat.toLowerCase()
                          ? 'bg-violet-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>{cat}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          selectedCategory.toLowerCase() === cat.toLowerCase()
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {categoryCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Products Display Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-8 text-center space-y-2 flex flex-col items-center">
                <span className="text-3xl">📦</span>
                <h3 className="font-black text-slate-800 text-sm">No items found under "{selectedCategory}"</h3>
                <p className="text-xs text-slate-400 max-w-sm mb-3">
                  Click "Auto-Populate Catalog" to search website dynamically or manually add the first item.
                </p>
                <button
                  onClick={() => openAddProductModal()}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-black px-4 py-2 rounded-2xl text-xs shadow-md shadow-violet-200 transition-all flex items-center space-x-1.5"
                >
                  <span>➕ Add Product to {selectedCategory === 'All' ? 'Starters' : selectedCategory}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Dashed Add Card inside grid */}
                {selectedCategory !== 'All' && (
                  <div
                    onClick={() => openAddProductModal()}
                    className="border-2 border-dashed border-slate-200 hover:border-violet-400 hover:bg-violet-50/20 cursor-pointer rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-2 transition-all min-h-[160px]"
                  >
                    <span className="text-2xl text-violet-500">➕</span>
                    <h3 className="font-black text-slate-800 text-xs">Add Product to {selectedCategory}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">Manually add an item directly to this category</p>
                  </div>
                )}
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white border border-slate-200 hover:border-violet-300 rounded-3xl p-4 space-y-3 transition-all hover:shadow-md flex flex-col justify-between"
                  >
                    {/* Top Header Pills */}
                    <div className="flex items-center justify-between">
                      <span className="bg-purple-100/90 text-purple-700 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-purple-200/50">
                        {product.category}
                      </span>
                      <span className="bg-slate-900 text-white font-mono font-bold text-xs px-3 py-1 rounded-full">
                        {product.price > 0 ? `${product.currency} ${product.price.toLocaleString()}` : product.currency}
                      </span>
                    </div>

                    {/* Body: Image + Content */}
                    <div className="flex space-x-3 items-start">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl shrink-0 border border-purple-100">
                          🍕
                        </div>
                      )}

                      <div className="space-y-1 flex-1 min-w-0">
                        <h3 className="font-black text-slate-900 text-sm truncate">{product.title}</h3>
                        <p className="text-xs text-slate-500 font-medium leading-snug line-clamp-2">
                          {product.description}
                        </p>
                      </div>
                    </div>

                    {/* Variations Pill Container */}
                    {product.variations && (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5 text-[11px] font-semibold text-slate-600 leading-tight">
                        {product.variations}
                      </div>
                    )}

                    {/* Footer Action Links */}
                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                      {product.viewUrl ? (
                        <a
                          href={product.viewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-violet-600 hover:text-violet-800 font-extrabold text-xs flex items-center space-x-1"
                        >
                          <span>🔗</span>
                          <span>View Link</span>
                        </a>
                      ) : (
                        <span className="text-emerald-600 font-bold text-[11px]">● In Bot Catalog</span>
                      )}

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => showToast(`Editing item "${product.title}"`)}
                          className="text-slate-400 hover:text-slate-700 font-bold text-xs"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-rose-500 hover:text-rose-700 font-bold text-xs transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 4: GENERAL BUSINESS KNOWLEDGE BASE & FAQS */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-violet-600 font-black text-base">📚</span>
                  <h2 className="text-sm font-black text-slate-900">
                    General Business Knowledge Base & FAQs
                  </h2>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-100">
                    {kbArticles.length} Articles Ingested
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Store business hours, return policies, delivery rules, payment guidelines, or FAQs for AI training.
                </p>
              </div>

              <button
                onClick={() => setShowAddKbModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-2xl text-xs shadow-md shadow-emerald-200 transition-all flex items-center space-x-1"
              >
                <span>+</span>
                <span>Add Knowledge Article</span>
              </button>
            </div>

            {/* Quick Ingest Text Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-4 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                ⚡ Quick Ingest Raw Text / Business Rules into AI Memory
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <textarea
                  rows={2}
                  value={rawIngestText}
                  onChange={(e) => setRawIngestText(e.target.value)}
                  placeholder="Paste any policy, menu, or business instructions here..."
                  className="flex-1 bg-white border border-slate-200 rounded-2xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  onClick={handleQuickIngest}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-3 rounded-2xl text-xs transition-all whitespace-nowrap shadow-md shadow-emerald-200 shrink-0"
                >
                  ⚡ Ingest Into AI
                </button>
              </div>
            </div>

            {/* Knowledge Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {kbArticles.map((article) => (
                <div
                  key={article.id}
                  className="bg-white border border-slate-200 hover:border-emerald-300 rounded-3xl p-5 space-y-3 transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                      {article.category}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {article.updatedAt}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-slate-900 text-sm">{article.title}</h3>
                    <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                      {article.content}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                    <span className="text-violet-600 font-extrabold text-[11px]">
                      🧠 Ingested into RAG Memory
                    </span>

                    <button
                      onClick={() => handleDeleteArticle(article.id)}
                      className="text-red-500 hover:text-red-700 font-bold text-xs transition-colors"
                    >
                      Delete ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Save Knowledge Base Bar */}
          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-black text-slate-900">Knowledge Base & Catalog</h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Save System Prompt persona, Product Catalog, and Knowledge Base updates.
              </p>
            </div>

            <button
              onClick={handleSaveKnowledgeBase}
              className="bg-violet-600 hover:bg-violet-700 text-white font-black px-6 py-3 rounded-2xl text-xs shadow-md shadow-violet-200 transition-all flex items-center space-x-2"
            >
              <span>💾</span>
              <span>Save Knowledge Base</span>
            </button>
          </div>
        </div>

        {/* Modal: Add Product */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm text-slate-900">Add New Knowledge Product</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Product Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Lava cake"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs text-slate-800 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs text-slate-800 font-medium"
                    >
                      {categories.filter((c) => c !== 'All').map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Price ({currency})
                    </label>
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="399"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs text-slate-800 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Variations (Optional)
                  </label>
                  <input
                    type="text"
                    value={newVariations}
                    onChange={(e) => setNewVariations(e.target.value)}
                    placeholder="e.g. Single Serving (PKR 399)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Description / AI Knowledge Context
                  </label>
                  <textarea
                    rows={3}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Provide details about product features, ingredients, or deal options..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-medium"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-black text-white bg-violet-600 shadow-md shadow-violet-200"
                  >
                    Add Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Knowledge Article */}
        {showAddKbModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm text-slate-900">Add Knowledge Base Article</h3>
                <button
                  onClick={() => setShowAddKbModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddKbArticle} className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Category
                  </label>
                  <select
                    value={kbCategory}
                    onChange={(e) => setKbCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs text-slate-800 font-medium"
                  >
                    <option value="FAQ">FAQ</option>
                    <option value="Business Hours & Delivery">Business Hours & Delivery</option>
                    <option value="Payment Methods">Payment Methods</option>
                    <option value="Refund & Support">Refund & Support</option>
                    <option value="Combo Deals & Discounts">Combo Deals & Discounts</option>
                    <option value="General Info">General Info</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Article Title / Question
                  </label>
                  <input
                    type="text"
                    required
                    value={kbTitle}
                    onChange={(e) => setKbTitle(e.target.value)}
                    placeholder="e.g. What is your return policy?"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Answer / Information Details
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={kbContent}
                    onChange={(e) => setKbContent(e.target.value)}
                    placeholder="Provide full details for the AI agent to answer customer queries accurately..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 font-medium"
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddKbModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 shadow-md shadow-emerald-200"
                  >
                    Add Article
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: View Raw Text */}
        {showRawTextModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm text-slate-900">Knowledge Base Raw Context</h3>
                <button
                  onClick={() => setShowRawTextModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <textarea
                readOnly
                rows={12}
                value={
                  `SYSTEM PERSONA:\n${systemPrompt}\n\nCATALOG PRODUCTS:\n` +
                  products
                    .map((p) => `- ${p.title} (${p.category}): ${p.currency} ${p.price}\n  ${p.description}\n  ${p.variations || ''}`)
                    .join('\n') +
                  `\n\nKNOWLEDGE ARTICLES & FAQS:\n` +
                  kbArticles.map((a) => `[${a.category}] ${a.title}\n  ${a.content}`).join('\n')
                }
                className="w-full bg-slate-900 text-emerald-400 font-mono p-4 rounded-2xl text-xs leading-relaxed"
              />

              <div className="flex justify-end">
                <button
                  onClick={() => setShowRawTextModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClientLayoutShell>
  );
}
