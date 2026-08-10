import React, { useEffect, useState } from 'react';
import {
  View,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Theme } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const PARTICLE_COUNT = 20;

interface Particle {
  id: number;
  angle: number;
  velocity: number;
  lifespan: number;
  size: number;
  opacity: Animated.Value;
  x: Animated.Value;
  y: Animated.Value;
}

interface ParticleExplosionProps {
  theme: Theme;
}

const ParticleExplosion: React.FC<ParticleExplosionProps> = ({ theme }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT;
      const velocity = 8 + Math.random() * 4;

      return {
        id: i,
        angle,
        velocity,
        lifespan: 0.8 + Math.random() * 0.4,
        size: 6 + Math.random() * 8,
        opacity: new Animated.Value(1),
        x: new Animated.Value(0),
        y: new Animated.Value(0),
      };
    });

    setParticles(newParticles);

    newParticles.forEach((particle) => {
      const endX = Math.cos(particle.angle) * particle.velocity * 100;
      const endY = Math.sin(particle.angle) * particle.velocity * 100;

      Animated.parallel([
        Animated.timing(particle.x, {
          toValue: endX,
          duration: particle.lifespan * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(particle.y, {
          toValue: endY,
          duration: particle.lifespan * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: particle.lifespan * 1000,
          useNativeDriver: true,
        }),
      ]).start();
    });

    const timer = setTimeout(() => {
      setParticles([]);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const colors = [
    theme.accent,
    theme.accentLight,
    '#FFD54F',
    '#FF7043',
    '#AB47BC',
  ];

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        { pointerEvents: 'none' },
      ]}
    >
      {particles.map((particle) => {
        const color = colors[particle.id % colors.length];

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                width: particle.size,
                height: particle.size,
                backgroundColor: color,
                opacity: particle.opacity,
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

export default ParticleExplosion;
