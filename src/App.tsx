import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, AlertTriangle, Loader2, Phone, Shield, MapPin, User, Heart } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isQuickReply?: boolean;
}

interface UserProfile {
  gender?: string;
  location?: string;
  name?: string;
  situation?: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Welcome message with user profiling
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      content: "Hello! I'm your Domestic Violence Helper. I'm here to provide confidential, personalized support for anyone experiencing domestic violence.\n\nTo help you better, may I know:\n1. How would you like me to address you? (Name or just 'Friend')\n2. Which state/city are you from?\n3. Are you seeking help for yourself or someone else?\n\nYou can share as much or as little as you're comfortable with. Everything here is completely confidential. 💙",
      role: 'assistant',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickReplies = [
    "I need immediate help",
    "Legal advice about domestic violence laws",
    "How to file a complaint",
    "Emotional support",
    "Safety planning",
    "Financial assistance schemes",
    "Child custody rights",
    "Protection orders"
  ];

  const getPersonalizedSystemPrompt = () => {
    let prompt = `You are the 'Domestic Violence Helper', a specialized, empathetic assistant providing support for domestic violence issues in India. You are culturally sensitive, warm, and provide actionable advice for ALL GENDERS.

IMPORTANT GUIDELINES:
- Always be compassionate, non-judgmental, and supportive
- Provide specific, actionable advice tailored to Indian laws and context
- Include relevant helpline numbers and local resources when appropriate
- Ask follow-up questions to understand the situation better
- Offer both immediate safety advice and long-term solutions
- Be encouraging and remind users of their strength and rights
- NEVER assume gender - domestic violence affects all genders
- Use gender-neutral language unless the user specifies their gender
- Acknowledge that men, women, and non-binary individuals can all be victims

USER CONTEXT:`;

    if (userProfile.name) prompt += `\n- User prefers to be called: ${userProfile.name}`;
    if (userProfile.location) prompt += `\n- Location: ${userProfile.location} (provide location-specific resources when possible)`;
    if (userProfile.gender) prompt += `\n- Gender: ${userProfile.gender}`;
    if (userProfile.situation) prompt += `\n- Situation: ${userProfile.situation}`;

    prompt += `\n\nKEY INDIAN LAWS TO REFERENCE:
- Section 498A IPC (Cruelty by spouse/relatives)
- Protection of Women from Domestic Violence Act 2005 (also protects live-in partners)
- Section 304B IPC (Dowry death)
- Section 323/325 IPC (Assault)
- Section 506 IPC (Criminal intimidation)
- Right to Residence under PWDVA

GENDER-INCLUSIVE APPROACH:
- Acknowledge that domestic violence affects people of all genders
- Provide appropriate resources for male victims, female victims, and LGBTQ+ individuals
- Be aware that legal protections may vary by gender but support is available for everyone
- Mention both gender-specific and gender-neutral helplines when relevant

ALWAYS provide specific next steps and remind them they're not alone, regardless of their gender.`;

    return prompt;
  };

  const handleQuickReply = (reply: string) => {
    setInputValue(reply);
    setShowQuickReplies(false);
    sendMessage(reply);
  };

  const extractUserInfo = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    // Extract location
    const indianStates = ['delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'ahmedabad', 'jaipur', 'lucknow', 'kanpur', 'nagpur', 'indore', 'thane', 'bhopal', 'visakhapatnam', 'pimpri', 'patna', 'vadodara', 'ghaziabad', 'ludhiana', 'agra', 'nashik', 'faridabad', 'meerut', 'rajkot', 'kalyan', 'vasai', 'varanasi', 'srinagar', 'aurangabad', 'dhanbad', 'amritsar', 'navi mumbai', 'allahabad', 'ranchi', 'howrah', 'coimbatore', 'jabalpur', 'gwalior', 'vijayawada', 'jodhpur', 'madurai', 'raipur', 'kota', 'guwahati', 'chandigarh', 'solapur', 'hubli', 'tiruchirappalli', 'bareilly', 'mysore', 'tiruppur', 'gurgaon', 'aligarh', 'jalandhar', 'bhubaneswar', 'salem', 'warangal', 'guntur', 'bhiwandi', 'saharanpur', 'gorakhpur', 'bikaner', 'amravati', 'noida', 'jamshedpur', 'bhilai', 'cuttack', 'firozabad', 'kochi', 'nellore', 'bhavnagar', 'dehradun', 'durgapur', 'asansol', 'rourkela', 'nanded', 'kolhapur', 'ajmer', 'akola', 'gulbarga', 'jamnagar', 'ujjain', 'loni', 'siliguri', 'jhansi', 'ulhasnagar', 'jammu', 'sangli', 'mangalore', 'erode', 'belgaum', 'ambattur', 'tirunelveli', 'malegaon', 'gaya', 'jalgaon', 'udaipur', 'maheshtala'];
    
    for (const state of indianStates) {
      if (lowerMessage.includes(state)) {
        setUserProfile(prev => ({ ...prev, location: state.charAt(0).toUpperCase() + state.slice(1) }));
        break;
      }
    }

    // Extract name patterns
    const namePatterns = [
      /my name is (\w+)/i,
      /i am (\w+)/i,
      /call me (\w+)/i,
      /i'm (\w+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match) {
        setUserProfile(prev => ({ ...prev, name: match[1] }));
        break;
      }
    }

    // Extract gender
    if (lowerMessage.includes('i am a woman') || lowerMessage.includes('i am female')) {
      setUserProfile(prev => ({ ...prev, gender: 'female' }));
    } else if (lowerMessage.includes('i am a man') || lowerMessage.includes('i am male')) {
      setUserProfile(prev => ({ ...prev, gender: 'male' }));
    }

    // Extract situation context
    if (lowerMessage.includes('spouse') || lowerMessage.includes('marriage') || lowerMessage.includes('husband') || lowerMessage.includes('wife')) {
      setUserProfile(prev => ({ ...prev, situation: 'marital abuse' }));
    } else if (lowerMessage.includes('family') || lowerMessage.includes('in-laws') || lowerMessage.includes('parents')) {
      setUserProfile(prev => ({ ...prev, situation: 'family abuse' }));
    } else if (lowerMessage.includes('dowry')) {
      setUserProfile(prev => ({ ...prev, situation: 'dowry harassment' }));
    } else if (lowerMessage.includes('partner') || lowerMessage.includes('boyfriend') || lowerMessage.includes('girlfriend')) {
      setUserProfile(prev => ({ ...prev, situation: 'intimate partner violence' }));
    }
  };

  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || inputValue.trim();
    if (!content || isLoading) return;

    // Extract user information from message
    extractUserInfo(content);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer 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",
          "HTTP-Referer": window.location.origin,
          "X-Title": "Domestic Violence Helper India",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "deepseek/deepseek-r1-0528:free",
          "messages": [
            {
              "role": "system",
              "content": getPersonalizedSystemPrompt()
            },
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              "role": "user",
              "content": content
            }
          ],
          "temperature": 0.8,
          "max_tokens": 1000
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const botMessage: Message = {
          id: Date.now().toString() + '_bot',
          content: data.choices[0].message.content,
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError('I apologize, but I encountered an error. Please try again or contact the helplines directly if this is urgent. Remember, you can always call 1091 for immediate support.');
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Domestic Violence Helper</h1>
                <p className="text-sm text-gray-600">Confidential support for everyone in India</p>
              </div>
            </div>
            
            {/* User Profile Display */}
            {(userProfile.name || userProfile.location) && (
              <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                {userProfile.name && (
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800">{userProfile.name}</span>
                  </div>
                )}
                {userProfile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800">{userProfile.location}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Emergency Helplines */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
            <div className="flex items-start gap-2 mb-2">
              <Phone className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800 text-sm">🚨 Emergency Helplines - Immediate Support</h3>
                <div className="text-sm text-red-700 mt-1 space-y-1">
                  <div><strong>Domestic Violence Helpline:</strong> 1091 (24/7 Free)</div>
                  <div><strong>National Commission for Women:</strong> 7827170170</div>
                  <div><strong>Men's Helpline (SIFF):</strong> +91-9990-888-888</div>
                  <div><strong>Police Emergency:</strong> 100</div>
                  <div><strong>One Stop Centre:</strong> 181</div>
                </div>
              </div>
            </div>
          </div>

          {/* Safety Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>Disclaimer:</strong> This chatbot provides information about Indian domestic violence laws and resources for all genders. It does not replace legal advice, medical consultation, or professional counseling. For immediate danger, call emergency services.
            </p>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-hidden flex flex-col max-w-4xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl px-4 py-3 rounded-2xl shadow-sm ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {/* Quick Reply Buttons */}
          {showQuickReplies && messages.length <= 2 && (
            <div className="flex justify-start">
              <div className="bg-purple-50 border border-purple-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl">
                <p className="text-sm text-purple-800 mb-3 font-medium">Quick options to get started:</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickReplies.map((reply, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickReply(reply)}
                      className="text-xs bg-white border border-purple-300 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors duration-200 text-left"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loading Message */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <p className="text-sm text-gray-600">Thinking carefully about your situation...</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex justify-start">
              <div className="bg-red-50 text-red-800 border border-red-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white px-4 py-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={userProfile.name 
                  ? `${userProfile.name}, share what's on your mind... I'm here to help 💙`
                  : "Share your situation, ask about laws, or just talk... I'm here to listen and help 💙"
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none min-h-[50px] max-h-32"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
          <Heart className="w-4 h-4 text-red-500" />
          <p className="text-xs text-gray-600 text-center">
            You are not alone. For immediate danger, call 100 (Police) or 1091 (Domestic Violence Helpline). This service is confidential and available 24/7 for everyone.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;