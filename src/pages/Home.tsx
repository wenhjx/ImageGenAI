import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Zap, Shield, TrendingUp, ArrowRight, Play } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';

const templates = [
  {
    id: 1,
    name: 'Artistic Portrait',
    description: 'Create stunning artistic portraits',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=artistic%20portrait%20of%20a%20beautiful%20woman%20with%20dramatic%20lighting%20oil%20painting%20style&image_size=portrait_4_3',
    category: 'Portrait',
  },
  {
    id: 2,
    name: 'Landscape',
    description: 'Generate breathtaking landscapes',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20mountain%20landscape%20with%20sunset%20cinematic%20photography&image_size=landscape_16_9',
    category: 'Landscape',
  },
  {
    id: 3,
    name: 'Product Mockup',
    description: 'Professional product presentations',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20product%20mockup%20white%20background%20professional%20photography&image_size=square',
    category: 'Product',
  },
  {
    id: 4,
    name: 'Abstract Art',
    description: 'Unique abstract compositions',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=abstract%20art%20colorful%20geometric%20shapes%20modern%20design&image_size=square',
    category: 'Abstract',
  },
];

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered',
    description: 'Leverage cutting-edge Nano Banana model for high-quality image generation',
  },
  {
    icon: Zap,
    title: 'Fast Generation',
    description: 'Generate images in seconds with optimized API calls',
  },
  {
    icon: Shield,
    title: 'Secure',
    description: 'Enterprise-grade security with encrypted API keys',
  },
  {
    icon: TrendingUp,
    title: 'Scalable',
    description: 'Perfect for developers, designers, and businesses of all sizes',
  },
];

const pricingPlans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for personal projects and experimentation',
    features: ['10 generations per month', 'Basic resolution (512x512)', 'Community support', 'Standard quality'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$19/month',
    description: 'For professionals who need more power',
    features: ['Unlimited generations', 'High resolution (1024x1024)', 'Priority support', 'Premium quality', 'API access'],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For businesses with advanced needs',
    features: ['Everything in Pro', 'Custom integrations', 'Dedicated support', 'SLA guarantee', 'Private deployment'],
    cta: 'Contact Us',
    popular: false,
  },
];

const Home = () => {
  const [quickPrompt, setQuickPrompt] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Portrait', 'Landscape', 'Product', 'Abstract'];
  const navigate = useNavigate();

  const handleQuickGenerate = () => {
    if (quickPrompt.trim()) {
      navigate(`/generate?prompt=${encodeURIComponent(quickPrompt)}`);
    }
  };

  const filteredTemplates = activeCategory === 'All' 
    ? templates 
    : templates.filter(t => t.category === activeCategory);

  return (
    <div className="min-h-screen pt-16">
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900/20 to-indigo-900" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-white/70">Powered by Nano Banana Model</span>
          </div>
          
          <h1 className="font-orbitron text-4xl sm:text-5xl lg:text-7xl font-bold mb-6">
            <span className="text-white">Create Amazing</span>
            <br />
            <span className="gradient-text">AI Images</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10">
            Transform your ideas into stunning visuals with our powerful AI image generation platform. 
            No technical skills required.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/generate">
              <Button size="lg">
                <Sparkles className="w-5 h-5" />
                Start Generating
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              <Play className="w-5 h-5" />
              Watch Demo
            </Button>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <Card>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={quickPrompt}
                  onChange={(e) => setQuickPrompt(e.target.value)}
                  placeholder="Describe what you want to create..."
                  className="input-field flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickGenerate()}
                />
                <Button onClick={handleQuickGenerate}>
                  <ArrowRight className="w-5 h-5" />
                  Generate
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-orbitron text-3xl sm:text-4xl font-bold text-white mb-4">
              Why Choose <span className="gradient-text">ImageGenAI</span>
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Experience the future of AI image generation with our cutting-edge platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} hover className="text-center">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-cyan-400" />
                </div>
                <h3 className="font-orbitron text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-white/60 text-sm">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-orbitron text-3xl sm:text-4xl font-bold text-white mb-4">
              Popular <span className="gradient-text">Templates</span>
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Get started quickly with our pre-built templates
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} hover className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-xl mb-4 aspect-square">
                  <img
                    src={template.image}
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs text-white">
                    {template.category}
                  </span>
                </div>
                <h3 className="font-orbitron text-lg font-semibold text-white mb-1">
                  {template.name}
                </h3>
                <p className="text-white/60 text-sm">
                  {template.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-orbitron text-3xl sm:text-4xl font-bold text-white mb-4">
              Simple <span className="gradient-text">Pricing</span>
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Choose the plan that fits your needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.popular ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/20' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-sm font-medium">
                    Most Popular
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="font-orbitron text-xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-4xl font-bold gradient-text mb-2">
                    {plan.price}
                  </p>
                  <p className="text-white/60 text-sm">
                    {plan.description}
                  </p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3 text-white/70">
                      <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  variant={plan.popular ? 'primary' : 'outline'}
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-orbitron font-bold gradient-text">ImageGenAI</span>
            </div>
            
            <div className="flex items-center gap-6">
              <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">
                Terms of Service
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors text-sm">
                Contact
              </a>
            </div>
            
            <p className="text-white/40 text-sm">
              2026 ImageGenAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
