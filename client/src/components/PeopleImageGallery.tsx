import React from 'react';

// Component that creates a gallery of real people images for benefits
export function PeopleImageGallery() {
  // We'll use a combination of images from reputable sources
  // These are URLs to diverse professional headshots
  const peopleImageUrls = [
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256&q=80",
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256&q=80",
  ];

  return (
    <div className="relative flex justify-center items-center">
      {/* Image stack with overlapping effect */}
      <div className="relative h-60 w-96">
        {peopleImageUrls.map((url, index) => (
          <div 
            key={index}
            className={`absolute rounded-lg shadow-lg overflow-hidden hover-lift transition-all duration-300
              ${index === 0 ? 'top-0 left-0 z-40 rotate-[-8deg] w-44 h-44' : ''}
              ${index === 1 ? 'top-6 left-10 z-30 rotate-[5deg] w-40 h-40' : ''}
              ${index === 2 ? 'top-20 left-4 z-20 rotate-[-3deg] w-36 h-36' : ''}
              ${index === 3 ? 'top-24 left-20 z-10 rotate-[7deg] w-32 h-32' : ''}
              ${index === 4 ? 'top-8 left-28 z-50 rotate-[-5deg] w-42 h-42' : ''}
            `}
          >
            <img 
              src={url} 
              alt="Employee portrait" 
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback in case image doesn't load
                e.currentTarget.src = `https://ui-avatars.com/api/?name=Employee&background=random&size=256`;
              }} 
            />
            
            {/* Optional overlay gradient for consistent look */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-60"></div>
          </div>
        ))}
      </div>
      
      {/* Decorative elements */}
      <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 opacity-50 -z-10 blur-xl"></div>
      <div className="absolute -top-4 -left-4 w-32 h-32 rounded-full bg-gradient-to-br from-cyan-200 to-blue-200 opacity-50 -z-10 blur-xl"></div>
      
      {/* Optional testimonial quote */}
      <div className="absolute -bottom-8 right-0 bg-white rounded-lg p-4 shadow-lg max-w-xs">
        <p className="text-sm italic text-gray-600">"The benefits portal made it so easy to understand my options and choose what's best for my family."</p>
        <p className="text-xs font-medium text-primary mt-2">- Sarah, Marketing Manager</p>
      </div>
    </div>
  );
}

// Component for single user testimonial with image
export function UserTestimonial({ 
  imageUrl, 
  name, 
  role, 
  quote 
}: { 
  imageUrl: string; 
  name: string; 
  role: string; 
  quote: string; 
}) {
  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 mb-4 shadow-md">
        <img 
          src={imageUrl} 
          alt={`${name}'s portrait`} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = `https://ui-avatars.com/api/?name=${name}&background=random&size=80`;
          }}
        />
      </div>
      
      <p className="text-gray-600 text-sm text-center italic mb-4">"{quote}"</p>
      
      <div className="text-center">
        <h4 className="font-semibold text-primary">{name}</h4>
        <p className="text-xs text-gray-500">{role}</p>
      </div>
    </div>
  );
}

// Collection of user testimonials
export function TestimonialGrid() {
  const testimonials = [
    {
      imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256&q=80",
      name: "Sarah Johnson",
      role: "Marketing Director",
      quote: "The benefits portal made everything so simple to understand. I was able to make informed choices for my family."
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256&q=80",
      name: "Michael Chen",
      role: "Software Engineer",
      quote: "The AI chat assistant answered all my benefits questions immediately, saving me hours of research."
    },
    {
      imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256&q=80",
      name: "Aisha Patel",
      role: "HR Specialist",
      quote: "Having all our benefits documents in one place has simplified our onboarding process."
    }
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {testimonials.map((testimonial, index) => (
        <UserTestimonial 
          key={index}
          imageUrl={testimonial.imageUrl}
          name={testimonial.name}
          role={testimonial.role}
          quote={testimonial.quote}
        />
      ))}
    </div>
  );
}