-- Font configs untuk customization
INSERT INTO "SiteConfig" (key, value, type) VALUES 
  ('font_body', 'DM Sans', 'string'),
  ('font_display', 'Playfair Display', 'string')
ON CONFLICT (key) DO NOTHING;
