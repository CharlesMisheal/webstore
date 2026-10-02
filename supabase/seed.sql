-- Seed Data for A-Plus Fashion Home
--
-- Safe to re-run: every statement upserts on its primary key. Re-running refreshes
-- demo catalogue content but never touches orders, payments, quotes, bookings or
-- customer data. Run AFTER both migrations in supabase/migrations/.
--
-- Images: the two client photos live in /public/images (feature-suit-ivory.jpg,
-- feature-suit-purple.jpg). Remaining demo products use Unsplash placeholders
-- until the owner uploads real photos from the admin panel.

-- 1. ADMINS (must also be listed in ADMIN_EMAILS env var — both checks are required)
insert into public.admins (email, added_by) values
('henryaplus82@gmail.com', 'system_init')
on conflict (email) do nothing;

-- 2. CATEGORIES
insert into public.categories (id, name, slug, description, image_path, sort_order, is_visible) values
('cat_suits', 'Suits', 'suits', 'Two-piece and three-piece bespoke and ready-to-wear tailored suits for weddings and executive elegance.', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80', 1, true),
('cat_blazers', 'Blazers & Jackets', 'blazers-jackets', 'Versatile statement blazers, velvet dinner jackets, and precision single-breasted coats.', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80', 2, true),
('cat_tuxedos', 'Tuxedos', 'tuxedos', 'Impeccable black tie and red carpet tuxedos with satin lapels and hand-finished accents.', 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=800&q=80', 3, true),
('cat_shirts', 'Shirts', 'shirts', 'Crisp Egyptian and Italian cotton dress shirts crafted for peak comfort and breathability.', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80', 4, true),
('cat_pants', 'Pants', 'pants', 'Hand-tailored formal trousers with side adjusters and sharp front creases.', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80', 5, true)
on conflict (id) do update set name = excluded.name, slug = excluded.slug, description = excluded.description, image_path = excluded.image_path, sort_order = excluded.sort_order;

-- 3. PRODUCTS
insert into public.products (id, category_id, name, slug, description, price_kobo, is_bespoke, is_featured, is_visible) values
('prod_crystal_three_piece', 'cat_suits', 'Crystal-Trim Three-Piece Suit', 'crystal-trim-three-piece-suit', 'Luxurious bespoke three-piece suit featuring handcrafted crystal-beaded peak lapel trims, double-breasted vest, and tailored trousers. Crafted in Ijebu-Ode for high-society occasions.', 18500000, true, true, true),
('prod_navy_executive', 'cat_suits', 'Navy Executive Three-Piece Suit', 'navy-executive-three-piece-suit', 'The timeless boardroom power suit in deep midnight navy Super 150s wool blend. Includes single-breasted two-button jacket, tailored waistcoat, and flat-front trousers.', 15000000, false, true, true),
('prod_modern_two_tone', 'cat_blazers', 'Modern Classic Two-Tone Blazer', 'modern-classic-two-tone-blazer', 'Striking contrast lapel blazer combining deep navy and warm camel tones. Tailored with kissing horn buttons and structured natural shoulders.', 9500000, false, true, true),
('prod_royal_purple_tux', 'cat_tuxedos', 'Royal Purple Tuxedo Set', 'royal-purple-tuxedo-set', 'Show-stopping rich purple tuxedo with deep black satin shawl lapels and matching silk bow tie. A regal choice for grooms and gala nights.', 21000000, true, true, true),
('prod_emerald_velvet', 'cat_blazers', 'Emerald Velvet Dinner Jacket', 'emerald-velvet-dinner-jacket', 'Sumptuous plush velvet in imperial emerald green with black grosgrain shawl collar. Perfect for evening galas and end-of-year banquets.', 13500000, false, true, true),
('prod_ivory_groom_suit', 'cat_suits', 'Ivory Double-Breasted Groom Suit', 'ivory-double-breasted-groom-suit', 'Ethereal ivory white double-breasted suit designed for the distinguished groom. Gold embossed buttons and custom monogrammed lining available on request.', 19500000, true, true, true),
('prod_egyptian_shirt', 'cat_shirts', 'Egyptian Cotton French Cuff Shirt', 'egyptian-cotton-french-cuff-shirt', 'Pure 100% long-staple Egyptian cotton shirt with structured spread collar and double French cuffs. Built to stay crisp all day in Nigerian weather.', 3500000, false, false, true),
('prod_charcoal_trousers', 'cat_pants', 'Charcoal Bespoke Pleated Trousers', 'charcoal-bespoke-pleated-trousers', 'Refined charcoal grey trousers with single forward pleats, functional side cinch adjusters, and a clean 2-inch cuff.', 4500000, false, false, true)
on conflict (id) do update set name = excluded.name, slug = excluded.slug, description = excluded.description, price_kobo = excluded.price_kobo, is_bespoke = excluded.is_bespoke, is_featured = excluded.is_featured;

-- 4. PRODUCT IMAGES
insert into public.product_images (id, product_id, storage_path, alt, sort_order, is_cover) values
('img_crystal_1', 'prod_crystal_three_piece', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80', 'Crystal-Trim Three-Piece Suit front view', 1, true),
('img_crystal_2', 'prod_crystal_three_piece', 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=800&q=80', 'Crystal lapel detail', 2, false),
('img_navy_1', 'prod_navy_executive', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80', 'Navy Executive Three-Piece front view', 1, true),
('img_two_tone_1', 'prod_modern_two_tone', 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80', 'Modern Two-Tone Blazer', 1, true),
('img_purple_1', 'prod_royal_purple_tux', '/images/feature-suit-purple.jpg', 'Royal Purple Tuxedo Set', 1, true),
('img_emerald_1', 'prod_emerald_velvet', 'https://images.unsplash.com/photo-1555069519-127aadedf1ee?auto=format&fit=crop&w=800&q=80', 'Emerald Velvet Dinner Jacket', 1, true),
('img_ivory_1', 'prod_ivory_groom_suit', '/images/feature-suit-ivory.jpg', 'Ivory Double-Breasted Groom Suit', 1, true),
('img_shirt_1', 'prod_egyptian_shirt', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80', 'Crisp White French Cuff Shirt', 1, true),
('img_pants_1', 'prod_charcoal_trousers', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80', 'Charcoal Bespoke Pleated Trousers', 1, true)
on conflict (id) do update set storage_path = excluded.storage_path, alt = excluded.alt, sort_order = excluded.sort_order, is_cover = excluded.is_cover;

-- 5. PRODUCT VARIANTS
insert into public.product_variants (id, product_id, size_label, sku, stock) values
-- Crystal-Trim
('var_crys_38', 'prod_crystal_three_piece', '38R', 'APF-CRY-38R', 4),
('var_crys_40', 'prod_crystal_three_piece', '40R', 'APF-CRY-40R', 6),
('var_crys_42', 'prod_crystal_three_piece', '42R', 'APF-CRY-42R', 5),
('var_crys_44', 'prod_crystal_three_piece', '44R', 'APF-CRY-44R', 3),
('var_crys_46', 'prod_crystal_three_piece', '46R', 'APF-CRY-46R', 2),
('var_crys_cust', 'prod_crystal_three_piece', 'Custom Made-to-Measure', 'APF-CRY-BESPOKE', 50),
-- Navy Executive
('var_navy_38', 'prod_navy_executive', '38R', 'APF-NVY-38R', 8),
('var_navy_40', 'prod_navy_executive', '40R', 'APF-NVY-40R', 12),
('var_navy_42', 'prod_navy_executive', '42R', 'APF-NVY-42R', 10),
('var_navy_44', 'prod_navy_executive', '44R', 'APF-NVY-44R', 5),
('var_navy_cust', 'prod_navy_executive', 'Custom Made-to-Measure', 'APF-NVY-BESPOKE', 50),
-- Modern Two-Tone
('var_two_40', 'prod_modern_two_tone', '40R', 'APF-2T-40R', 7),
('var_two_42', 'prod_modern_two_tone', '42R', 'APF-2T-42R', 9),
('var_two_44', 'prod_modern_two_tone', '44R', 'APF-2T-44R', 4),
-- Royal Purple Tux
('var_purp_38', 'prod_royal_purple_tux', '38R', 'APF-PUR-38R', 3),
('var_purp_40', 'prod_royal_purple_tux', '40R', 'APF-PUR-40R', 5),
('var_purp_42', 'prod_royal_purple_tux', '42R', 'APF-PUR-42R', 4),
('var_purp_cust', 'prod_royal_purple_tux', 'Custom Made-to-Measure', 'APF-PUR-BESPOKE', 30),
-- Emerald Velvet
('var_eme_40', 'prod_emerald_velvet', '40R', 'APF-EME-40R', 5),
('var_eme_42', 'prod_emerald_velvet', '42R', 'APF-EME-42R', 6),
('var_eme_44', 'prod_emerald_velvet', '44R', 'APF-EME-44R', 3),
-- Ivory Groom
('var_ivo_40', 'prod_ivory_groom_suit', '40R', 'APF-IVO-40R', 4),
('var_ivo_42', 'prod_ivory_groom_suit', '42R', 'APF-IVO-42R', 5),
('var_ivo_cust', 'prod_ivory_groom_suit', 'Custom Made-to-Measure', 'APF-IVO-BESPOKE', 40),
-- Shirt
('var_sh_15', 'prod_egyptian_shirt', '15.5 Collar (M)', 'APF-SHT-155', 20),
('var_sh_16', 'prod_egyptian_shirt', '16.0 Collar (L)', 'APF-SHT-160', 25),
('var_sh_165', 'prod_egyptian_shirt', '16.5 Collar (XL)', 'APF-SHT-165', 18),
-- Pants
('var_pnt_32', 'prod_charcoal_trousers', '32 Waist', 'APF-PNT-32', 12),
('var_pnt_34', 'prod_charcoal_trousers', '34 Waist', 'APF-PNT-34', 15),
('var_pnt_36', 'prod_charcoal_trousers', '36 Waist', 'APF-PNT-36', 10)
on conflict (id) do update set size_label = excluded.size_label, sku = excluded.sku;

-- 6. REVIEWS
insert into public.reviews (id, product_id, author_name, author_location, rating, body, status) values
('rev_1', 'prod_crystal_three_piece', 'Tobi Adeleke', 'Lagos', 5, 'The tan three-piece fit perfectly and arrived in four days. Henry and his team delivered beyond expectations for my wedding reception.', 'approved'),
('rev_2', 'prod_navy_executive', 'Barrister Chinedu O.', 'Abuja', 5, 'Unmatched craftsmanship. The fabric drape and shoulder pad structure are equivalent to Savile Row, but made right here in Ogun State.', 'approved'),
('rev_3', 'prod_royal_purple_tux', 'Dr. Femi B.', 'Ibadan', 5, 'Wore this to our annual physicians gala and received non-stop compliments all evening. The satin lapel is impeccably tailored.', 'approved'),
('rev_4', 'prod_ivory_groom_suit', 'Emeka K.', 'London, UK', 5, 'Ordered from the UK with video call measurements. Fits like a glove with zero alterations needed! Will be ordering all my formal wear from A-Plus.', 'approved')
on conflict (id) do nothing;

-- 7. STORE SETTINGS
insert into public.store_settings (key, value) values
('homepage_banners', '[
  {
    "id": "banner_1",
    "headline": "Wear Class, Live Bold.",
    "sub": "Tailored suits, tuxedos and blazers made to fit you — ready to wear or made to measure in Ijebu-Ode.",
    "cta_label": "Shop the collection",
    "cta_href": "/shop",
    "secondary_label": "Request a quote",
    "secondary_href": "/quote",
    "image_path": "/images/feature-suit-ivory.jpg",
    "visible": true,
    "sort_order": 1
  }
]'::jsonb),
('about', '{
  "headline": "Crafting Sartorial Distinction in Ijebu-Ode",
  "story_html": "<p>Founded by master tailor Henry Abraham, A-Plus Fashion Home combines traditional British tailoring finesse with vibrant Nigerian flair. For over 5 years, we have outfitted grooms, executives, and international connoisseurs who refuse to compromise on fit, fabric, or finish.</p>",
  "years": 5,
  "product_count": "100+",
  "happy_clients": "1,200+"
}'::jsonb),
('contact', '{
  "whatsapp": "+2347071374515",
  "phone": "+2347071374515",
  "alt_phone": "09055080524",
  "email": "henryaplus82@gmail.com",
  "address": "2 Jagunmolu Street, Ondo Road, Ijebu-Ode, Ogun State, Nigeria",
  "hours": "Mon–Sat 9:00 AM – 6:00 PM"
}'::jsonb),
('social', '{
  "instagram": "https://instagram.com/aplusfashionhome",
  "facebook": "https://facebook.com/aplusfashionhome",
  "tiktok": "https://tiktok.com/@aplusfashionhome",
  "whatsapp_channel": "https://wa.me/2347071374515"
}'::jsonb),
('fx_rates', '{
  "USD": 1550,
  "GBP": 1980
}'::jsonb),
('delivery_rules', '[
  {"id": "del_lagos_ogun", "label": "Lagos & Ogun Express Courier", "fee_kobo": 450000, "eta": "1–3 business days"},
  {"id": "del_nationwide", "label": "Nationwide Nigeria (Waybill / Courier)", "fee_kobo": 750000, "eta": "3–5 business days"},
  {"id": "del_pickup", "label": "Shop Pick-up (2 Jagunmolu St, Ijebu-Ode)", "fee_kobo": 0, "eta": "Ready within 24 hours"},
  {"id": "del_intl", "label": "International Express (DHL Worldwide)", "fee_kobo": 4500000, "eta": "5–8 business days"}
]'::jsonb)
-- Never overwrite settings the owner has already published from the admin panel.
on conflict (key) do nothing;
