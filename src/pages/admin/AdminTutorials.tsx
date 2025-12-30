import React, { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    Video,
    Globe,
    X,
    Loader,
    Upload,
    Play,
    Pause,
    CheckCircle2,
    Languages
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TutorialService, Tutorial } from '../../services/tutorial';
import { FileUploadService } from '../../services/fileUpload';
import toast from 'react-hot-toast';

export const AdminTutorials: React.FC = () => {
    const [tutorials, setTutorials] = useState<Tutorial[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [form, setForm] = useState({
        title: '',
        description: '',
        language: 'english' as 'hausa' | 'english',
        order: 0
    });

    const [videoFile, setVideoFile] = useState<File | null>(null);

    useEffect(() => {
        loadTutorials();
    }, []);

    const loadTutorials = async () => {
        try {
            setLoading(true);
            const data = await TutorialService.getTutorials();
            setTutorials(data);
        } catch (error) {
            console.error('Error loading tutorials:', error);
            toast.error('Failed to load tutorials');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('video/')) {
                toast.error('Please upload a video file');
                return;
            }
            if (file.size > 100 * 1024 * 1024) { // 100MB limit
                toast.error('Video file is too large (max 100MB)');
                return;
            }
            setVideoFile(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!videoFile && !form.title) {
            toast.error('Title and Video are required');
            return;
        }

        try {
            setSaving(true);
            setUploadProgress(0);

            let videoUrl = '';
            let videoName = '';
            let videoType = '';

            if (videoFile) {
                // Using a simplified upload without explicit progress for now as FileUploadService might wrap it
                videoUrl = await FileUploadService.uploadFile(
                    videoFile,
                    `tutorials/${form.language}`
                );
                videoName = videoFile.name;
                videoType = videoFile.type;
            }

            await TutorialService.createTutorial({
                title: form.title,
                description: form.description,
                language: form.language,
                order: form.order,
                videoUrl,
                videoName,
                videoType
            });

            toast.success('Tutorial added successfully');
            setShowModal(false);
            resetForm();
            loadTutorials();
        } catch (error) {
            console.error('Error saving tutorial:', error);
            toast.error('Failed to save tutorial');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setForm({
            title: '',
            description: '',
            language: 'english',
            order: tutorials.length
        });
        setVideoFile(null);
    };

    const handleDelete = async (tutorial: Tutorial) => {
        if (!window.confirm('Delete this tutorial?')) return;
        try {
            await TutorialService.deleteTutorial(tutorial.id!, tutorial.videoUrl);
            toast.success('Tutorial removed');
            loadTutorials();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const tutorialsByLanguage = (lang: 'hausa' | 'english') =>
        tutorials.filter(t => t.language === lang);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-6 pt-20">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Video Tutorials</h1>
                    <p className="text-gray-600">Manage learning resources for business owners</p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Tutorial
                </Button>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Hausa Tutorials */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <Languages className="h-5 w-5 text-indigo-600" />
                        <h2 className="text-lg font-bold">Hausa Tutorials</h2>
                        <span className="ml-auto rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                            {tutorialsByLanguage('hausa').length}
                        </span>
                    </div>
                    <div className="grid gap-4">
                        {tutorialsByLanguage('hausa').map(tutorial => (
                            <TutorialCard key={tutorial.id} tutorial={tutorial} onDelete={() => handleDelete(tutorial)} />
                        ))}
                        {tutorialsByLanguage('hausa').length === 0 && (
                            <p className="text-center py-8 text-gray-500 italic">No Hausa tutorials yet</p>
                        )}
                    </div>
                </div>

                {/* English Tutorials */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-bold">English Tutorials</h2>
                        <span className="ml-auto rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            {tutorialsByLanguage('english').length}
                        </span>
                    </div>
                    <div className="grid gap-4">
                        {tutorialsByLanguage('english').map(tutorial => (
                            <TutorialCard key={tutorial.id} tutorial={tutorial} onDelete={() => handleDelete(tutorial)} />
                        ))}
                        {tutorialsByLanguage('english').length === 0 && (
                            <p className="text-center py-8 text-gray-500 italic">No English tutorials yet</p>
                        )}
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-md">
                        <div className="flex items-center justify-between border-b p-4">
                            <h2 className="text-lg font-bold">New Video Tutorial</h2>
                            <button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Language</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, language: 'hausa' }))}
                                        className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${form.language === 'hausa' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 border-gray-200'}`}
                                    >
                                        Hausa
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, language: 'english' }))}
                                        className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${form.language === 'english' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200'}`}
                                    >
                                        English
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <Input
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="e.g., How to add products"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                                <textarea
                                    className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                                    rows={3}
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Video File</label>
                                <div className="mt-1 flex justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-6 hover:border-blue-500 cursor-pointer relative">
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleFileChange}
                                        accept="video/*"
                                    />
                                    <div className="text-center">
                                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                        <p className="mt-1 text-xs text-gray-500">
                                            {videoFile ? videoFile.name : 'Click to upload video (.mp4, .mov)'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)} disabled={saving}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1" disabled={saving}>
                                    {saving ? 'Uploading...' : 'Save Tutorial'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

const TutorialCard: React.FC<{ tutorial: Tutorial; onDelete: () => void }> = ({ tutorial, onDelete }) => {
    return (
        <Card className="overflow-hidden group">
            <div className="p-4 flex gap-4">
                <div className="h-16 w-24 bg-gray-100 rounded flex items-center justify-center flex-shrink-0 relative overflow-hidden group-hover:bg-gray-200 transition-colors">
                    <Video className="h-6 w-6 text-gray-400" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-5 w-5 text-white fill-current" />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{tutorial.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{tutorial.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            {tutorial.videoType?.split('/')[1]?.toUpperCase() || 'VIDEO'}
                        </span>
                        <a
                            href={tutorial.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-medium text-blue-600 hover:underline"
                        >
                            View Video
                        </a>
                    </div>
                </div>
                <button
                    onClick={onDelete}
                    className="self-start p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </Card>
    );
};
