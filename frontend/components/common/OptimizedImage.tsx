import React from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  quality?: number;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 75
}) => {
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`(max-width: 768px) 100vw, ${width}px`}
        className="object-cover"
        priority={priority}
        quality={quality}
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  );
};

export default OptimizedImage;
