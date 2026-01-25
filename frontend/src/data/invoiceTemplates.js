/**
 * Invoice Template System
 * Defines 4 professional invoice templates with different styles
 * Each template controls: fonts, colors, spacing, logo placement, header style
 */

export const INVOICE_TEMPLATES = {
  'modern-clean': {
    name: 'Modern Clean',
    description: 'Clean, minimalist design with modern typography',
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      accent: '#f0f9ff',
      text: '#1e293b',
      lightText: '#64748b',
      border: '#e2e8f0'
    },
    fonts: {
      heading: 'Segoe UI, Tahoma, Geneva, Verdana',
      body: 'Segoe UI, Tahoma, Geneva, Verdana'
    },
    spacing: {
      headerPadding: '40px',
      sectionMargin: '30px',
      itemPadding: '15px'
    },
    logo: {
      maxWidth: '150px',
      maxHeight: '60px',
      position: 'top-left'
    }
  },
  'corporate-blue': {
    name: 'Corporate Blue',
    description: 'Professional corporate style with blue branding',
    colors: {
      primary: '#003366',
      secondary: '#0066cc',
      accent: '#e6f2ff',
      text: '#1a1a1a',
      lightText: '#666666',
      border: '#ccddff'
    },
    fonts: {
      heading: 'Georgia, serif',
      body: 'Arial, sans-serif'
    },
    spacing: {
      headerPadding: '50px',
      sectionMargin: '35px',
      itemPadding: '18px'
    },
    logo: {
      maxWidth: '180px',
      maxHeight: '70px',
      position: 'top-center'
    }
  },
  'minimal-white': {
    name: 'Minimal White',
    description: 'Elegant minimal design with maximum whitespace',
    colors: {
      primary: '#000000',
      secondary: '#4b5563',
      accent: '#f8f9fa',
      text: '#000000',
      lightText: '#757575',
      border: '#e0e0e0'
    },
    fonts: {
      heading: 'Helvetica Neue, Arial',
      body: 'Helvetica Neue, Arial'
    },
    spacing: {
      headerPadding: '60px',
      sectionMargin: '40px',
      itemPadding: '20px'
    },
    logo: {
      maxWidth: '120px',
      maxHeight: '50px',
      position: 'top-left'
    }
  },
  'bold-dark': {
    name: 'Bold Dark',
    description: 'Bold design with dark background and vibrant accents',
    colors: {
      primary: '#ffffff',
      secondary: '#e0e0e0',
      accent: '#1a1a1a',
      text: '#ffffff',
      lightText: '#b0b0b0',
      border: '#333333'
    },
    fonts: {
      heading: 'Trebuchet MS, sans-serif',
      body: 'Trebuchet MS, sans-serif'
    },
    spacing: {
      headerPadding: '45px',
      sectionMargin: '32px',
      itemPadding: '16px'
    },
    logo: {
      maxWidth: '140px',
      maxHeight: '55px',
      position: 'top-right'
    },
    darkBackground: true
  }
  ,
  // Premium templates
  'elegant-gold': {
    name: 'Elegant Gold',
    description: 'Premium luxury template with gold accents and refined typography',
    colors: {
      primary: '#b58833',
      secondary: '#6b5b3b',
      accent: '#fff9f2',
      text: '#1b1b1b',
      lightText: '#6b6b6b',
      border: '#efe6dc'
    },
    fonts: {
      heading: 'Georgia, serif',
      body: 'Georgia, serif'
    },
    spacing: {
      headerPadding: '48px',
      sectionMargin: '36px',
      itemPadding: '18px'
    },
    logo: {
      maxWidth: '160px',
      maxHeight: '70px',
      position: 'top-right'
    },
    premium: true
  },
  'creative-gradient': {
    name: 'Creative Gradient',
    description: 'Modern creative layout with vibrant gradient accents and playful layout',
    colors: {
      primary: '#ff7a59',
      secondary: '#6f5ce8',
      accent: 'linear-gradient(90deg, #ff7a59 0%, #6f5ce8 100%)',
      text: '#111827',
      lightText: '#6b7280',
      border: '#f3f4f6'
    },
    fonts: {
      heading: 'Inter, system-ui, -apple-system, Segoe UI, Roboto',
      body: 'Inter, system-ui, -apple-system, Segoe UI, Roboto'
    },
    spacing: {
      headerPadding: '36px',
      sectionMargin: '28px',
      itemPadding: '14px'
    },
    logo: {
      maxWidth: '140px',
      maxHeight: '60px',
      position: 'top-left'
    },
    premium: true
  },
  'architect-grid': {
    name: 'Architect Grid',
    description: 'Grid-based professional template ideal for studios and agencies',
    colors: {
      primary: '#0b5a6f',
      secondary: '#0f1724',
      accent: '#e6f7fb',
      text: '#0f1724',
      lightText: '#475569',
      border: '#dbeeff'
    },
    fonts: {
      heading: 'Montserrat, sans-serif',
      body: 'Montserrat, sans-serif'
    },
    spacing: {
      headerPadding: '42px',
      sectionMargin: '34px',
      itemPadding: '16px'
    },
    logo: {
      maxWidth: '150px',
      maxHeight: '60px',
      position: 'top-center'
    },
    premium: true
  }
  ,
  'modern-minimal': {
    name: 'Modern Minimal',
    description: 'Soft minimal layout focused on whitespace and readability',
    colors: {
      primary: '#2b2b2b',
      secondary: '#6b7280',
      accent: '#f7fafc',
      text: '#0f1724',
      lightText: '#6b7280',
      border: '#e6eef6'
    },
    fonts: {
      heading: 'Inter, system-ui, -apple-system, Segoe UI, Roboto',
      body: 'Inter, system-ui, -apple-system, Segoe UI, Roboto'
    },
    spacing: {
      headerPadding: '40px',
      sectionMargin: '28px',
      itemPadding: '12px'
    },
    logo: {
      maxWidth: '130px',
      maxHeight: '50px',
      position: 'top-left'
    },
    premium: true
  },
  'classic-legal': {
    name: 'Classic Legal',
    description: 'Traditional legal-style invoice with structured sections and serif fonts',
    colors: {
      primary: '#1f2937',
      secondary: '#374151',
      accent: '#ffffff',
      text: '#0b1220',
      lightText: '#475569',
      border: '#d1d5db'
    },
    fonts: {
      heading: 'Times New Roman, Georgia, serif',
      body: 'Georgia, serif'
    },
    spacing: {
      headerPadding: '50px',
      sectionMargin: '30px',
      itemPadding: '16px'
    },
    logo: {
      maxWidth: '140px',
      maxHeight: '60px',
      position: 'top-center'
    },
    premium: true
  },
  'startup-pitch': {
    name: 'Startup Pitch',
    description: 'Energetic and modern layout suitable for startups and agencies',
    colors: {
      primary: '#0ea5a4',
      secondary: '#0f1724',
      accent: '#effaf9',
      text: '#0f1724',
      lightText: '#64748b',
      border: '#cfece9'
    },
    fonts: {
      heading: 'Poppins, system-ui, -apple-system',
      body: 'Poppins, system-ui, -apple-system'
    },
    spacing: {
      headerPadding: '36px',
      sectionMargin: '26px',
      itemPadding: '12px'
    },
    logo: {
      maxWidth: '150px',
      maxHeight: '60px',
      position: 'top-left'
    },
    premium: true
  },
  'sunrise-gradient': {
    name: 'Sunrise Gradient',
    description: 'Warm gradient header with soft tones for creative businesses',
    colors: {
      primary: '#ffb760',
      secondary: '#ff6b6b',
      accent: 'linear-gradient(90deg,#ffdba1 0%,#ffb760 100%)',
      text: '#0b1220',
      lightText: '#7c7c7c',
      border: '#fff1e6'
    },
    fonts: {
      heading: 'Nunito, system-ui, -apple-system',
      body: 'Nunito, system-ui, -apple-system'
    },
    spacing: {
      headerPadding: '44px',
      sectionMargin: '30px',
      itemPadding: '14px'
    },
    logo: {
      maxWidth: '150px',
      maxHeight: '60px',
      position: 'top-right'
    },
    premium: true
  },
  'monochrome-elegant': {
    name: 'Monochrome Elegant',
    description: 'Sleek monochrome layout for refined professional invoices',
    colors: {
      primary: '#111827',
      secondary: '#374151',
      accent: '#f8fafc',
      text: '#0f1724',
      lightText: '#6b7280',
      border: '#e5e7eb'
    },
    fonts: {
      heading: 'Merriweather, Georgia, serif',
      body: 'Merriweather, Georgia, serif'
    },
    spacing: {
      headerPadding: '48px',
      sectionMargin: '34px',
      itemPadding: '18px'
    },
    logo: {
      maxWidth: '140px',
      maxHeight: '55px',
      position: 'top-left'
    },
    premium: true
  }
};

export const TEMPLATE_IDS = Object.keys(INVOICE_TEMPLATES);

/**
 * Get template configuration by ID
 * @param {string} templateId - Template ID
 * @returns {object} - Template configuration
 */
export const getTemplate = (templateId = 'modern-clean') => {
  return INVOICE_TEMPLATES[templateId] || INVOICE_TEMPLATES['modern-clean'];
};

/**
 * Get all template options for selector
 * @returns {array} - Array of {value, label} pairs
 */
export const getTemplateOptions = () => {
  return Object.entries(INVOICE_TEMPLATES).map(([key, value]) => ({
    value: key,
    label: value.name,
    description: value.description
  }));
};
