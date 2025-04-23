import React from "react";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: number;
  className?: string;
  fallback?: React.ReactNode;
}

export const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ aspectRatio, className, fallback, alt, ...props }, ref) => {
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [error, setError] = React.useState(false);

    const handleLoad = () => {
      setIsLoaded(true);
    };

    const handleError = () => {
      setError(true);
    };

    return (
      <div className={cn("overflow-hidden", className)}>
        {aspectRatio ? (
          <AspectRatio ratio={aspectRatio}>
            {!error ? (
              <img
                ref={ref}
                alt={alt}
                className={cn(
                  "h-full w-full object-cover transition-opacity duration-300",
                  !isLoaded && "opacity-0",
                  isLoaded && "opacity-100"
                )}
                onLoad={handleLoad}
                onError={handleError}
                {...props}
              />
            ) : (
              fallback || <div className="flex h-full items-center justify-center bg-muted">{alt}</div>
            )}
          </AspectRatio>
        ) : (
          <>
            {!error ? (
              <img
                ref={ref}
                alt={alt}
                className={cn(
                  "h-full w-full object-cover transition-opacity duration-300",
                  !isLoaded && "opacity-0",
                  isLoaded && "opacity-100"
                )}
                onLoad={handleLoad}
                onError={handleError}
                {...props}
              />
            ) : (
              fallback || <div className="flex h-full items-center justify-center bg-muted">{alt}</div>
            )}
          </>
        )}
      </div>
    );
  }
);

Image.displayName = "Image";