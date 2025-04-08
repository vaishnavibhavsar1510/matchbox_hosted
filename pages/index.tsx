import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useState } from 'react';

// Connection Node type
type ConnectionNode = {
  x: number;
  y: number;
  size: number;
  speed: number;
  direction: number;
  color: string;
};

export default function Home() {
  const router = useRouter();
  const [nodes, setNodes] = useState<ConnectionNode[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Initialize and handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    // Initial setup
    updateDimensions();
    generateNodes();

    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Generate initial nodes
  const generateNodes = () => {
    const colors = ['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6'];
    const newNodes: ConnectionNode[] = [];
    for (let i = 0; i < 30; i++) {
      newNodes.push({
        x: Math.random() * (window.innerWidth - 20),
        y: Math.random() * (window.innerHeight - 20),
        size: Math.random() * 20 + 10,
        speed: Math.random() * 0.4 + 0.1,
        direction: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    setNodes(newNodes);
  };

  // Animate nodes
  useEffect(() => {
    const animateNodes = () => {
      setNodes(prevNodes => 
        prevNodes.map(node => {
          let newX = node.x + Math.cos(node.direction) * node.speed;
          let newY = node.y + Math.sin(node.direction) * node.speed;
          let newDirection = node.direction;

          // Bounce off walls
          if (newX <= 0 || newX >= dimensions.width - node.size) {
            newDirection = Math.PI - newDirection;
          }
          if (newY <= 0 || newY >= dimensions.height - node.size) {
            newDirection = -newDirection;
          }

          return {
            ...node,
            x: newX < 0 ? 0 : newX > dimensions.width - node.size ? dimensions.width - node.size : newX,
            y: newY < 0 ? 0 : newY > dimensions.height - node.size ? dimensions.height - node.size : newY,
            direction: newDirection
          };
        })
      );
    };

    const interval = setInterval(animateNodes, 16);
    return () => clearInterval(interval);
  }, [dimensions]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <Head>
        <title>MatchBox - Dating, Done Differently</title>
        <meta name="description" content="A new way to meet people in real life through planned activities and AI-powered matchmaking" />
      </Head>
      
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/dating-bg.jpg"
          alt="Social gathering"
          layout="fill"
          objectFit="cover"
          quality={100}
          priority
          className="brightness-[0.3]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/90 via-purple-900/95 to-black"></div>
      </div>

      {/* Dynamic Connection Background */}
      <div className="fixed inset-0 z-[1]">
        <svg 
          width={dimensions.width} 
          height={dimensions.height} 
          className="w-full h-full"
        >
          {/* Connection Lines */}
          {nodes.map((node1, i) => 
            nodes.map((node2, j) => {
              if (i < j) {
                const distance = Math.sqrt(
                  Math.pow(node1.x - node2.x, 2) + 
                  Math.pow(node1.y - node2.y, 2)
                );
                if (distance < 200) {
                  const opacity = (200 - distance) / 200;
                  return (
                    <line
                      key={`line-${i}-${j}`}
                      x1={node1.x + node1.size/2}
                      y1={node1.y + node1.size/2}
                      x2={node2.x + node2.size/2}
                      y2={node2.y + node2.size/2}
                      stroke={`rgba(167, 139, 250, ${opacity * 0.5})`}
                      strokeWidth="1"
                    />
                  );
                }
              }
              return null;
            })
          )}
          
          {/* Nodes */}
          {nodes.map((node, i) => (
            <g key={`node-${i}`}>
              {/* Glow effect */}
              <circle
                cx={node.x + node.size/2}
                cy={node.y + node.size/2}
                r={node.size/2 + 4}
                fill="none"
                stroke={`${node.color}40`}
                strokeWidth="2"
              />
              {/* Main circle */}
              <circle
                cx={node.x + node.size/2}
                cy={node.y + node.size/2}
                r={node.size/2}
                fill={node.color}
                className="filter drop-shadow-lg"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))'
                }}
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="p-4 backdrop-blur-sm bg-black/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-violet-100 tracking-wide">MATCHBOX</h1>
            <div className="flex gap-6">
              <button
                onClick={() => router.push('/auth/signin')}
                className="px-8 py-3 text-lg text-violet-200 hover:text-violet-100 transition-colors font-medium hover:scale-105 transform duration-300"
              >
                Sign in
              </button>
              <button
                onClick={() => router.push('/auth/signup')}
                className="px-8 py-3 text-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full hover:from-violet-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 font-medium shadow-lg shadow-violet-500/25 border border-violet-400/20"
              >
                Sign up
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 text-center">
          <h2 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight bg-gradient-to-r from-violet-200 via-purple-200 to-violet-200 text-transparent bg-clip-text drop-shadow-lg">
            Dating, done differently
          </h2>
          <p className="text-xl text-violet-200 mb-10 max-w-2xl mx-auto drop-shadow leading-relaxed">
            A new way to meet people in real life through planned activities and AI-powered matchmaking
          </p>
          <button
            onClick={() => router.push('/auth/signup')}
            className="px-10 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-lg rounded-full hover:from-violet-500 hover:to-purple-500 transform hover:scale-105 transition-all duration-300 font-medium shadow-xl shadow-violet-900/30 border border-violet-400/20"
          >
            Get Started
          </button>
        </div>

        {/* How It Works Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h3 className="text-3xl font-semibold text-violet-100 text-center mb-16 drop-shadow-lg tracking-wide">
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Find Your Match */}
            <div className="group text-center backdrop-blur-md bg-black/40 rounded-2xl p-8 border border-violet-400/10 hover:bg-violet-950/40 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg shadow-violet-900/20">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl rotate-45 transform group-hover:rotate-0 transition-transform duration-300 flex items-center justify-center shadow-lg border border-violet-400/20">
                <svg className="w-10 h-10 text-violet-100 -rotate-45 group-hover:rotate-0 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-violet-100 mb-4 drop-shadow">Find Your Match</h4>
              <p className="text-violet-200 leading-relaxed">
                Answer questions and let our AI suggest compatible matches
              </p>
            </div>

            {/* Meet In Person */}
            <div className="group text-center backdrop-blur-md bg-black/40 rounded-2xl p-8 border border-violet-400/10 hover:bg-violet-950/40 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg shadow-violet-900/20">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl rotate-45 transform group-hover:rotate-0 transition-transform duration-300 flex items-center justify-center shadow-lg border border-violet-400/20">
                <svg className="w-10 h-10 text-violet-100 -rotate-45 group-hover:rotate-0 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-violet-100 mb-4 drop-shadow">Meet In Person</h4>
              <p className="text-violet-200 leading-relaxed">
                Join curated events and activities with your matches
              </p>
            </div>

            {/* Ask the Right Questions */}
            <div className="group text-center backdrop-blur-md bg-black/40 rounded-2xl p-8 border border-violet-400/10 hover:bg-violet-950/40 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg shadow-violet-900/20">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl rotate-45 transform group-hover:rotate-0 transition-transform duration-300 flex items-center justify-center shadow-lg border border-violet-400/20">
                <svg className="w-10 h-10 text-violet-100 -rotate-45 group-hover:rotate-0 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
          </div>
              <h4 className="text-xl font-semibold text-violet-100 mb-4 drop-shadow">Ask the Right Questions</h4>
              <p className="text-violet-200 leading-relaxed">
                Share your interests to prompt genuine conversations
              </p>
          </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-violet-300/60">
        <p>© 2024 MatchBox. All rights reserved.</p>
      </footer>
    </div>
  );
} 