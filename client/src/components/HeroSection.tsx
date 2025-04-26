import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useCompanyTheme } from '@/hooks/use-company-theme';
import { PeopleImageGallery, TestimonialGrid } from '@/components/PeopleImageGallery';
import benefitsHeroSvg from '../assets/benefits_hero.svg';
import healthBenefitSvg from '../assets/health_benefit.svg';
import retirementBenefitSvg from '../assets/retirement_benefit.svg';

export function HeroSection() {
  const { companySettings } = useCompanyTheme();
  const companyName = companySettings?.name || "Your Company";
  const heroTitle = companySettings?.heroTitle || "Simplified";
  const heroSubtitle = companySettings?.heroSubtitle || "Benefits Experience";
  const heroDescription = companySettings?.heroDescription || `Access information, take surveys, and get personalized support with your ${companyName} employee benefits - all in one place.`;
  const heroImageUrl = companySettings?.heroImageUrl;
  
  return (
    <div className="relative overflow-hidden border-b">
      {/* Background with subtle pattern and gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 opacity-80"></div>
      
      {/* Background pattern (optional) */}
      <div className="absolute inset-0 opacity-5" style={{ 
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.4\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")',
        backgroundSize: '20px 20px'
      }}></div>
      
      {/* Main hero content */}
      <div className="relative container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6 md:pr-12">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              <span className="gradient-text">{heroTitle}</span><br />
              <span className="text-gray-800">{heroSubtitle}</span>
            </h1>
            
            <p className="text-lg text-gray-600 max-w-xl">
              {heroDescription}
            </p>
            
            {/* Buttons removed as requested */}
          </div>
          
          <div className="flex justify-center md:justify-end relative">
            {/* Use custom hero image if provided, otherwise show people gallery */}
            {heroImageUrl ? (
              <div className="relative h-60 w-full md:w-96 rounded-lg overflow-hidden shadow-xl">
                <img 
                  src={heroImageUrl} 
                  alt="Hero image"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to the people gallery if image fails to load
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                    const gallery = document.getElementById('people-gallery');
                    if (gallery) {
                      gallery.style.display = 'block';
                    }
                  }}
                />
              </div>
            ) : (
              <div id="people-gallery">
                <PeopleImageGallery />
              </div>
            )}
            
            {/* Keep decorative floating images as accents */}
            <div className="absolute -top-8 -left-12 w-16 h-16 opacity-80 animate-float-slow z-20 hidden md:block">
              <img 
                src={healthBenefitSvg}
                alt="Health benefits" 
                className="w-full h-full drop-shadow-md"
              />
            </div>
            
            <div className="absolute bottom-0 -right-8 w-16 h-16 opacity-80 animate-float z-20 hidden md:block">
              <img 
                src={retirementBenefitSvg}
                alt="Retirement benefits" 
                className="w-full h-full drop-shadow-md"
              />
            </div>
            
            {/* Background decoration */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-50 blur-2xl"></div>
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-cyan-200 to-purple-200 rounded-full opacity-50 blur-2xl"></div>
          </div>
        </div>
        
        {/* Features section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <Link href="/surveys" className="block">
            <div className="bg-white rounded-xl shadow-md p-6 hover-lift border-gradient transition-all duration-300 h-full">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Surveys & Feedback</h3>
              <p className="text-gray-600">Complete surveys to help us improve your benefits experience and tailor offerings to your needs.</p>
            </div>
          </Link>
          
          <Link href="/chat" className="block">
            <div className="bg-white rounded-xl shadow-md p-6 hover-lift border-gradient transition-all duration-300 h-full">
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Chat Assistant</h3>
              <p className="text-gray-600">Get immediate answers to your benefits questions with our AI-powered chat assistant.</p>
            </div>
          </Link>
          
          <Link href="/calendar" className="block">
            <div className="bg-white rounded-xl shadow-md p-6 hover-lift border-gradient transition-all duration-300 h-full">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Benefits Calendar</h3>
              <p className="text-gray-600">Stay informed about upcoming benefits events, enrollment periods, and important deadlines.</p>
            </div>
          </Link>
        </div>
        
        {/* Testimonials section with real people */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">What Our Users Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Real feedback from employees using our benefits platform</p>
          </div>
          
          <TestimonialGrid />
        </div>
      </div>
    </div>
  );
}