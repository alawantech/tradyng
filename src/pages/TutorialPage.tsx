import React, { useState, useEffect } from 'react';
import {
    Video,
    Globe,
    Play,
    Languages,
    ChevronRight,
    X,
    Loader
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TutorialService, Tutorial } from '../services/tutorial';
import { Footer } from '../components/layout/Footer';
import { Navbar } from '../components/layout/Navbar';
import toast from 'react-hot-toast';

export const TutorialPage: React.FC = () => {
    const [tutorials, setTutorials] = useState<Tutorial[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchingVideo, setFetchingVideo] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<'hausa' | 'english'>('english');
    const [playingTutorial, setPlayingTutorial] = useState<Tutorial | null>(null);

    useEffect(() => {
        loadTutorials();
    }, [selectedLanguage]);

    const loadTutorials = async () => {
        try {
            setLoading(true);
            // Fetching only titles and descriptions 
            // (Note: videoUrl is stripped in the service or handled here if limited)
            const data = await TutorialService.getTutorials(selectedLanguage);
            setTutorials(data);
        } catch (error) {
            console.error('Error loading tutorials:', error);
            toast.error('Failed to load tutorials');
        } finally {
            setLoading(false);
        }
    };

    const handlePlayTutorial = async (tutorial: Tutorial) => {
        try {
            setFetchingVideo(true);
            // Fetch the full tutorial details (including video URL) only on demand
            const fullTutorial = await TutorialService.getTutorialById(tutorial.id!);
            setPlayingTutorial(fullTutorial);
        } catch (error) {
            console.error('Error fetching tutorial details:', error);
            toast.error('Failed to load video. Please try again.');
        } finally {
            setFetchingVideo(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                        Learning <span className="text-blue-600">Hub</span>
                    </h1>
                    <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                        Master your business with our step-by-step video guides.
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Languages className="h-5 w-5 text-blue-600" />
                                Select a language to watch tutorial
                            </h2>
                            <p className="text-sm text-gray-500">Choisissez votre langue préférée / Zabi yaren da kake so</p>
                        </div>

                        <div className="flex p-1 bg-gray-100 rounded-xl w-full md:w-auto">
                            <button
                                onClick={() => setSelectedLanguage('english')}
                                className={`flex-1 md:flex-none md:min-w-[120px] py-2 px-4 rounded-lg text-sm font-bold transition-all ${selectedLanguage === 'english'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <Globe className="h-4 w-4" />
                                    English
                                </span>
                            </button>
                            <button
                                onClick={() => setSelectedLanguage('hausa')}
                                className={`flex-1 md:flex-none md:min-w-[120px] py-2 px-4 rounded-lg text-sm font-bold transition-all ${selectedLanguage === 'hausa'
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <Languages className="h-4 w-4" />
                                    Hausa
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                        <p className="text-gray-500 animate-pulse">Fetching tutorials...</p>
                    </div>
                ) : (
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {tutorials.map((tutorial) => (
                            <PublicTutorialCard
                                key={tutorial.id}
                                tutorial={tutorial}
                                onPlay={() => handlePlayTutorial(tutorial)}
                            />
                        ))}
                        {tutorials.length === 0 && (
                            <div className="col-span-full py-20 text-center">
                                <div className="bg-white rounded-2xl p-12 border-2 border-dashed border-gray-200">
                                    <Video className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">No tutorials found</h3>
                                    <p className="text-gray-500 max-w-sm mx-auto">
                                        We haven't added any tutorials in {selectedLanguage} yet. Please check back soon or try another language!
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="mt-6"
                                        onClick={() => {
                                            setSelectedLanguage(selectedLanguage === 'english' ? 'hausa' : 'english');
                                        }}
                                    >
                                        Try {selectedLanguage === 'english' ? 'Hausa' : 'English'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Video Player Modal */}
            {playingTutorial && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-10 backdrop-blur-sm animate-in fade-in duration-300">
                    <button
                        onClick={() => setPlayingTutorial(null)}
                        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full z-10"
                    >
                        <X className="h-8 w-8" />
                    </button>

                    <div
                        className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <video
                            src={playingTutorial.videoUrl}
                            controls
                            autoPlay
                            className="w-full h-full"
                        >
                            Your browser does not support the video tag.
                        </video>
                        <div className="bg-black/50 backdrop-blur-md p-4 flex items-center justify-between border-t border-white/5">
                            <h3 className="text-white font-bold text-lg">{playingTutorial.title}</h3>
                            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded uppercase">
                                {playingTutorial.language}
                            </span>
                        </div>
                    </div>

                    {/* Backdrop Click to Close */}
                    <div className="absolute inset-0 -z-10" onClick={() => setPlayingTutorial(null)} />
                </div>
            )}

            {/* Fetching Video Loader Overlay */}
            {fetchingVideo && (
                <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                    <Loader className="h-12 w-12 text-white animate-spin mb-4" />
                    <p className="text-white font-bold text-lg animate-pulse">Preparing video...</p>
                </div>
            )}

            <Footer />
        </div>
    );
};

interface PublicTutorialCardProps {
    tutorial: Tutorial;
    onPlay: () => void;
}

const PublicTutorialCard: React.FC<PublicTutorialCardProps> = ({ tutorial, onPlay }) => {
    return (
        <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-none bg-white rounded-2xl flex flex-col h-full ring-1 ring-gray-100 hover:ring-blue-100">
            {/* Thumbnail Area - Clickable */}
            <div
                onClick={onPlay}
                className="aspect-video bg-gray-900 relative cursor-pointer overflow-hidden"
            >
                {/* Background Placeholder/Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="h-12 w-12 text-gray-800" />
                </div>

                {/* Persistent Overlay with Play Button */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="bg-white/30 backdrop-blur-md rounded-full p-4 transform group-hover:scale-110 transition-all duration-300 shadow-2xl ring-4 ring-white/20 group-hover:ring-white/40">
                        <Play className="h-10 w-10 text-white fill-current" />
                    </div>
                </div>

                {/* Language Tag */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className="bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                        {tutorial.language}
                    </span>
                </div>
            </div>

            <div className="p-6 flex flex-col flex-1">
                <h3
                    onClick={onPlay}
                    className="text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-blue-600 transition-colors line-clamp-2"
                >
                    {tutorial.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-3 mb-6 flex-1">
                    {tutorial.description}
                </p>

                <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="uppercase font-semibold tracking-wider">Tap to play guide</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onPlay}
                        className="text-blue-600 hover:text-blue-800 font-bold group/btn"
                    >
                        Watch Now
                        <ChevronRight className="ml-1 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>
        </Card>
    );
};
