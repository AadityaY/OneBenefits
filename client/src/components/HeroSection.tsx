import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import benefitsHeroSvg from '../assets/benefits_hero.svg';
import healthBenefitSvg from '../assets/health_benefit.svg';
import retirementBenefitSvg from '../assets/retirement_benefit.svg';

export function HeroSection() {
  return (
    <div className="relative">
      {/* Background with subtle pattern and gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 opacity-70"></div>
      
      {/* Main hero content */}
      <div className="relative container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              <span className="gradient-text">Simplify Your</span><br />
              <span className="text-gray-800">Benefits Experience</span>
            </h1>
            
            <p className="text-lg text-gray-600 max-w-xl">
              Access information, take surveys, and get personalized support with your employee benefits - all in one place.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                <Link href="/take-survey">Take Survey</Link>
              </Button>
              
              <Button variant="outline" size="lg">
                <Link href="/chat">Chat with Benefits AI</Link>
              </Button>
            </div>
          </div>
          
          <div className="flex justify-center md:justify-end">
            <div className="relative">
              {/* Main hero image */}
              <img 
                src={benefitsHeroSvg}
                alt="Benefits illustration" 
                className="w-full max-w-md z-10 relative"
              />
              
              {/* Decorative floating images */}
              <img 
                src={healthBenefitSvg}
                alt="" 
                className="absolute -top-8 -left-12 w-20 h-20 opacity-60 animate-float-slow"
              />
              
              <img 
                src={retirementBenefitSvg}
                alt="" 
                className="absolute bottom-0 -right-8 w-24 h-24 opacity-70 animate-float"
              />
            </div>
          </div>
        </div>
        
        {/* Features section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="bg-white rounded-xl shadow-sm p-6 hover-lift border-gradient">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Surveys & Feedback</h3>
            <p className="text-gray-600">Complete surveys to help us improve your benefits experience and tailor offerings to your needs.</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 hover-lift border-gradient">
            <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Chat Assistant</h3>
            <p className="text-gray-600">Get immediate answers to your benefits questions with our AI-powered chat assistant.</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 hover-lift border-gradient">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Benefits Calendar</h3>
            <p className="text-gray-600">Stay informed about upcoming benefits events, enrollment periods, and important deadlines.</p>
          </div>
        </div>
      </div>
    </div>
  );
}