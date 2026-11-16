import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowDown, TrendingUp, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import ContactForm from '@/components/ContactForm';

const Index = () => {
  const scrollToDashboard = () => {
    const dashboardElement = document.getElementById('app-section');
    dashboardElement?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    {
      icon: TrendingUp,
      title: 'Predictive Analytics',
      description: 'AI-powered delay predictions before they impact your supply chain',
    },
    {
      icon: Shield,
      title: 'Real-time Monitoring',
      description: 'Track shipments and suppliers with live visibility dashboards',
    },
    {
      icon: Zap,
      title: 'Instant Alerts',
      description: 'Get notified immediately when delays are detected or predicted',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background"
      >
        {/* Vibrant gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20" />
        <div className="absolute inset-0 bg-background/85" />

        <div className="relative z-10 container mx-auto px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-card p-12 mb-8 bg-gradient-to-br from-card via-card to-primary/5"
            >
              <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6">
                <span className="gradient-text animate-float inline-block">DelaySense AI</span>
              </h1>
              <p className="text-xl md:text-2xl text-foreground mb-8 font-medium">
                Predict. Prevent. Perform — AI-powered supply-chain visibility.
              </p>
              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={scrollToDashboard}
                  className="bg-gradient-to-r from-primary via-secondary to-primary hover:opacity-90 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-2xl transition-all"
                >
                  Enter Dashboard
                  <ArrowDown className="ml-2 w-5 h-5 animate-bounce" />
                </Button>
              </div>
            </motion.div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {features.map((feature, idx) => {
                const gradients = [
                  'from-primary/10 to-primary/5',
                  'from-secondary/10 to-secondary/5',
                  'from-accent/10 to-accent/5',
                ];
                const iconColors = ['text-primary', 'text-secondary', 'text-accent'];
                
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + idx * 0.1 }}
                    className={`glass-card p-6 hover:scale-105 hover:shadow-2xl transition-all duration-300 bg-gradient-to-br ${gradients[idx]}`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center mx-auto mb-4 ${iconColors[idx]}`}>
                      <feature.icon className="w-6 h-6" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-lg font-heading font-semibold mb-2 text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <ArrowDown className="w-8 h-8 text-primary animate-bounce" />
        </motion.div>
      </section>

      {/* App Section (Dashboard redirect) */}
      <section id="app-section" className="min-h-screen flex items-center justify-center bg-background">
        <div className="container mx-auto px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-heading font-bold mb-6">Welcome to Your Dashboard</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Choose a section to explore your supply chain insights
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                { to: '/dashboard', icon: TrendingUp, title: 'Dashboard', desc: 'View KPIs and trends', gradient: 'from-primary/10 to-primary/5', iconColor: 'text-primary' },
                { to: '/alerts', icon: Shield, title: 'Alerts', desc: 'Monitor active alerts', gradient: 'from-warning/10 to-warning/5', iconColor: 'text-warning' },
                { to: '/reports', icon: Zap, title: 'Reports', desc: 'Generate insights', gradient: 'from-accent/10 to-accent/5', iconColor: 'text-accent' },
                { to: '/chat', icon: Shield, title: 'Chat', desc: 'Ask DelaySense AI', gradient: 'from-success/10 to-success/5', iconColor: 'text-success' },
              ].map((item, idx) => (
                <Link key={item.to} to={item.to}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    viewport={{ once: true }}
                    className={`glass-card p-8 hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer bg-gradient-to-br ${item.gradient}`}
                  >
                    <div className={`w-14 h-14 rounded-xl bg-white shadow-lg flex items-center justify-center mx-auto mb-4 ${item.iconColor}`}>
                      <item.icon className="w-7 h-7" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-xl font-heading font-semibold mb-2 text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-10">
              <h2 className="text-4xl font-heading font-bold mb-6 gradient-text">Get in Touch</h2>
              <p className="text-xl text-muted-foreground">
                Interested in DelaySense AI for your supply chain? Request a demo and let's discuss how we can help you predict, prevent, and optimize your operations.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Contact Form */}
              <ContactForm />

              {/* Contact Details */}
              <div className="glass-card p-8 bg-gradient-to-br from-card to-primary/5 h-fit">
                <h3 className="text-2xl font-heading font-bold mb-6 text-foreground">Contact Details</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-heading font-semibold text-base mb-2 text-muted-foreground">Email</h4>
                    <a href="mailto:dhinova.ai@gmail.com" className="text-primary hover:underline text-lg">
                      dhinova.ai@gmail.com
                    </a>
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-base mb-2 text-muted-foreground">Phone</h4>
                    <a href="tel:+918978021742" className="text-primary hover:underline text-lg">
                      +91 8978021742
                    </a>
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-base mb-2 text-muted-foreground">Company</h4>
                    <a 
                      href="https://dhinova-ignite-flow.lovable.app/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline text-lg break-all"
                    >
                      dhinova-ignite-flow.lovable.app
                    </a>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    We typically respond within 24 hours during business days
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;
