"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Github,
  Linkedin,
  Instagram,
  Mail,
  X,
  ExternalLink,
  User,
  Sparkles
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePlayer } from '@/app/context/PlayerContext';
import Image from "next/image";

export default function DevInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { trackSocialClick, trackProfileClick } = useAnalytics();
  const { activeTrack } = usePlayer();

  const socialLinks = [
    {
      name: 'GitHub',
      url: 'https://github.com/rendydev404',
      icon: <Github size={12} />,
      bgColor: 'bg-primary'
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/in/rendi-irawan-93190732b/',
      icon: <Linkedin size={12} />,
      bgColor: 'bg-primary'
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/rendyy_404/',
      icon: <Instagram size={12} />,
      bgColor: 'bg-primary'
    },
    {
      name: 'Email',
      url: 'mailto:irawanrendy55@gmail.com',
      icon: <Mail size={12} />,
      bgColor: 'bg-primary'
    }
  ];

  const handleSocialClick = (platform: string) => {
    trackSocialClick(platform);
  };

  const handleProfileClick = () => {
    trackProfileClick();
    setIsOpen(true);
  };

  const handleImageClick = () => {
    if (!selectedImage) {
      setSelectedImage('/pp1.jpg');
    }
  };

  return (
    <>
      {/* Floating Profile Button with Dynamic Positioning */}
      <div className={`fixed left-4 md:left-8 z-[45] transition-all duration-300 ease-in-out
        ${activeTrack 
          ? 'bottom-[10rem] md:bottom-24' // 1rem di atas player
          : 'bottom-20 md:bottom-8'
        }`
      }>
        <motion.button
          onClick={handleProfileClick}
          className="bg-primary hover:bg-primary/90 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          whileHover={{ 
            scale: 1.1,
            boxShadow: "0 0 20px rgba(96, 22, 255, 0.5)"
          }}
          whileTap={{ scale: 0.95 }}
          animate={{
            scale: [1, 1.05, 1],
            boxShadow: [
              "0 4px 15px rgba(96, 22, 255, 0.3)",
              "0 8px 25px rgba(96, 22, 255, 0.6)",
              "0 4px 15px rgba(96, 22, 255, 0.3)"
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          title="Developer Info"
        >
          <User size={28} />
        </motion.button>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-gray-900/95 backdrop-blur-xl rounded-2xl p-3 sm:p-4 w-full max-w-xs border border-primary/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-bold text-white">Developer</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Profile Section */}
              <div className="text-center mb-3 sm:mb-4">
                <div className="relative inline-block mb-2 sm:mb-3">
                  <motion.div 
                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-2 ring-primary/30 cursor-pointer hover:ring-primary/50 transition-all duration-300"
                    onClick={handleImageClick}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Ripple effects */}
                    <motion.div
                      className="absolute inset-0 rounded-full border border-primary/30"
                      animate={{
                        scale: [1, 1.5],
                        opacity: [0.4, 0]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border border-primary/30"
                      animate={{
                        scale: [1, 1.5],
                        opacity: [0.3, 0]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeOut",
                        delay: 0.4
                      }}
                    />
                    {/* Glowing border */}
                    <div className="absolute inset-0 rounded-full border-2 border-primary/50 shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.3)]" />
                    
                    {/* Image container with proper sizing */}
                    <div className="relative w-full h-full rounded-full overflow-hidden">
                      <Image
                        src="/pp.jpg"
                        alt="Rendy Irawan"
                        fill
                        className="object-cover rounded-full"
                        sizes="(max-width: 640px) 64px, 80px"
                      />
                    </div>
                  </motion.div>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1">Rendy Irawan</h3>
                <p className="text-white text-xs font-medium mb-1">Full Stack Developer</p>
               
              </div>

              {/* Social Links */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-1">
                  <Sparkles size={10} className="text-primary" />
                  Connect with me:
                </h4>
                {socialLinks.map((link, index) => (
                  <motion.a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleSocialClick(link.name.toLowerCase())}
                    className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg hover:bg-primary/10 border border-gray-700/50 hover:border-primary/30 transition-all duration-300 group"
                    whileHover={{ scale: 1.02, x: 3 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${link.bgColor} bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300`}>
                        {link.icon}
                      </div>
                      <span className="text-white text-xs font-medium group-hover:text-primary transition-colors">{link.name}</span>
                    </div>
                    <ExternalLink size={12} className="text-gray-400 group-hover:text-primary transition-colors" />
                  </motion.a>
                ))}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-sm sm:max-w-md max-h-[80vh] sm:max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-[300px] h-[300px] sm:w-[400px] sm:h-[400px]">
                {/* Ripple effects */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/90"
                  animate={{
                    scale: [1, 1.5],
                    opacity: [0.7, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/70"
                  animate={{
                    scale: [1, 1.5],
                    opacity: [0.6, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 0.5
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/40"
                  animate={{
                    scale: [1, 1.5],
                    opacity: [0.5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 1
                  }}
                />

                {/* Glowing border */}
                <div className="absolute inset-0 rounded-full border-2 border-primary shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.5)] animate-pulse" />

                {/* Image container */}
                <div className="absolute inset-[4px] rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"
                    animate={{
                      opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  <Image
                    src={selectedImage}
                    alt="Developer"
                    fill
                    className="object-cover rounded-full relative z-0"
                    sizes="(max-width: 640px) 300px, 400px"
                  />
                </div>
              </div>
              {/* Improved close button with higher z-index and better visibility */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(null);
                }}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/70 text-white p-3 rounded-full hover:bg-black shadow-lg hover:shadow-xl transition-all duration-300 z-[60] backdrop-blur-sm"
              >
                <X size={20} className="drop-shadow-lg" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 