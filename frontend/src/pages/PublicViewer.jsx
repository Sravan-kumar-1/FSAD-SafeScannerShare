import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck, Link2Off, AlertTriangle, ShieldAlert, Clock } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { streamSharedDocument, getShareMetadata, streamRawDocument, getRawDocumentMetadata } from '../api/documentService';
import PageTransition from '../components/PageTransition';

// react-pdf styles
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PublicViewer = () => {
    // Determine the route context: Public Share {token} vs Private Native View {id}
    const { token, id } = useParams();
    const isNativeOwnerView = Boolean(id);
    const identifier = token || id;

    const hasFetched = useRef(false);

    const [numPages, setNumPages] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorType, setErrorType] = useState(null); // 'expired' | 'invalid' | 'generic'
    const [errorMessage, setErrorMessage] = useState('');
    const [fileUrl, setFileUrl] = useState(null);
    const [fileContent, setFileContent] = useState(null);
    const [contentType, setContentType] = useState(null);
    const [timestamp, setTimestamp] = useState(new Date().toLocaleString());

    // Auto-Kick Live State
    const [expiresAt, setExpiresAt] = useState(null);
    const [documentName, setDocumentName] = useState('Secure Document');
    const [customWatermark, setCustomWatermark] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setTimestamp(new Date().toLocaleString());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        let objectUrl = null;

        const fetchDocument = async () => {
            try {
                setLoading(true);

                // 1. Fetch metadata based on the route context
                let metadata;
                if (isNativeOwnerView) {
                    metadata = await getRawDocumentMetadata(id);
                } else {
                    metadata = await getShareMetadata(token);
                }

                if (metadata.expiresAt) {
                    setExpiresAt(new Date(metadata.expiresAt));
                }

                setDocumentName(metadata.documentName);
                setContentType(metadata.contentType);

                if (metadata.watermarkText) {
                    setCustomWatermark({
                        text: metadata.watermarkText,
                        opacity: metadata.watermarkOpacity ?? 15,
                        size: metadata.watermarkSize ?? 14,
                        density: metadata.watermarkDensity ?? 100
                    });
                }

                // 2. Fetch the heavy raw Blob data natively or via share
                let blob;
                if (isNativeOwnerView) {
                    blob = await streamRawDocument(id);
                } else {
                    blob = await streamSharedDocument(token);
                }

                if (metadata.contentType && metadata.contentType.startsWith("text/")) {
                    const text = await blob.text();
                    setFileContent(text);
                } else {
                    objectUrl = URL.createObjectURL(blob);
                    setFileUrl(objectUrl);
                }
            } catch (err) {
                console.error("Error streaming shared document:", err);
                const status = err.response?.status;

                if (status === 410) {
                    setErrorType('expired');
                    setErrorMessage(`HTTP 410: This sharing link has already expired. Please ask the owner to share it again.`);
                } else if (status === 404 || status === 403) {
                    setErrorType('invalid');
                    setErrorMessage(`HTTP ${status}: Invalid share token, link burned (self-destructed), or access denied.`);
                } else {
                    setErrorType('generic');
                    setErrorMessage(`HTTP ${status || 'Unknown'}: Failed to load document. The secure connection could not be established.`);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDocument();

        // Memory Cleanup
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [identifier, isNativeOwnerView, token, id]);

    // Live Auto-Expiration Heartbeat
    useEffect(() => {
        if (!expiresAt || errorType) return;

        const timer = setInterval(() => {
            const diff = expiresAt.getTime() - new Date().getTime();

            if (diff <= 0) {
                // EXPIRE LIVE
                clearInterval(timer);
                if (fileUrl) {
                    URL.revokeObjectURL(fileUrl); // Rip it from browser memory
                    setFileUrl(null); // Remove from React State
                }
                setErrorType('expired');
                setErrorMessage('For your security, this active session has automatically expired and the file has been securely wiped from memory.');
            } else {
                // Update Badge Format
                const totalSeconds = Math.floor(diff / 1000);
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                setTimeRemaining(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [expiresAt, fileUrl, errorType]);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
    }

    // Generate a watermark pattern
    const WatermarkOverlay = () => {
        const watermarks = Array(20).fill(null);
        return (
            <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden flex flex-wrap justify-center items-center opacity-10">
                {watermarks.map((_, i) => (
                    <div
                        key={i}
                        className="w-1/4 h-1/5 flex flex-col items-center justify-center -rotate-45"
                    >
                        <p className="text-slate-400 font-black text-xl whitespace-nowrap">PUBLIC VIEWER</p>
                        <p className="text-slate-500 font-bold text-sm whitespace-nowrap">DOCUSAFE VAULT</p>
                        <p className="text-slate-500 text-xs whitespace-nowrap">{timestamp}</p>
                    </div>
                ))}
            </div>
        );
    };

    const renderError = () => {
        let Icon = AlertTriangle;
        let title = "Access Error";

        if (errorType === 'expired') {
            Icon = Link2Off;
            title = "Link Expired";
        } else if (errorType === 'invalid') {
            Icon = ShieldAlert;
            title = "Access Denied";
        }

        return (
            <div className="flex flex-col items-center justify-center h-[70vh] px-4">
                <style>
                    {`
                    @media print {
                        body { display: none !important; }
                    }
                    `}
                </style>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl relative overflow-hidden"
                >
                    {errorType === 'expired' && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500" />}
                    {errorType === 'invalid' && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-red-900" />}

                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Icon className={`w-8 h-8 ${errorType === 'expired' ? 'text-orange-400' : 'text-red-400'}`} />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-200 mb-2">{title}</h2>
                    <p className="text-slate-400 mb-8">{errorMessage}</p>

                    <Link to="/" className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors">
                        Go to DocuSafe
                    </Link>
                </motion.div>
            </div>
        );
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-950 text-white flex flex-col select-none relative overflow-hidden">
                <style>
                    {`
                    @media print {
                        html, body { display: none !important; }
                    }
                    `}
                </style>

                {/* Abstract background */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

                {/* Secure Header */}
                <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 z-50 flex items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                        <h1 className="font-bold tracking-wider text-sm md:text-base">DOCUSAFE<span className="text-indigo-400">VAULT</span></h1>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                            {documentName}
                        </span>
                        <span className={`text-[10px] flex items-center gap-1 ${isNativeOwnerView ? 'text-blue-400' : 'text-emerald-400'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isNativeOwnerView ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                            {isNativeOwnerView ? 'Native Proxy (Owner View)' : 'Secure Stream'}
                        </span>
                    </div>
                </header>

                {/* Viewer Container - Disable right click */}
                <main
                    className="flex-1 pt-24 pb-12 px-4 flex justify-center z-10"
                    onContextMenu={(e) => e.preventDefault()}
                >
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                            <p className="text-slate-400 font-medium">Establishing secure connection...</p>
                        </div>
                    ) : errorType ? (
                        renderError()
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                            className={`relative w-full bg-slate-900 rounded-xl shadow-2xl shadow-blue-900/10 overflow-hidden border border-slate-800 ${contentType && contentType.includes("image") ? 'max-w-[95vw] h-full flex justify-center items-center' : 'max-w-4xl'}`}
                        >
                            <WatermarkOverlay />

                            <div className={`flex justify-center flex-col items-center w-full h-full min-h-[90vh] ${contentType && contentType.includes("image") ? 'p-2' : 'py-8 px-4'}`}>
                                {contentType && contentType.toLowerCase().includes("pdf") && fileUrl && (
                                    <Document
                                        file={fileUrl}
                                        onLoadSuccess={onDocumentLoadSuccess}
                                        loading={
                                            <div className="flex flex-col items-center gap-3 text-slate-400 py-12">
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                <span>Rendering secure document...</span>
                                            </div>
                                        }
                                        error={
                                            <div className="flex flex-col items-center gap-2 text-red-400 bg-red-500/10 p-6 rounded-xl m-8 border border-red-500/20 text-center">
                                                <AlertTriangle className="w-8 h-8 mb-2" />
                                                <span className="font-bold">Rendering Error</span>
                                                <span className="text-sm opacity-80">Unable to display PDF. The file may be corrupt or simply not a PDF.</span>
                                            </div>
                                        }
                                    >
                                        {Array.from(new Array(numPages || 0), (el, index) => (
                                            <Page
                                                key={`page_${index + 1}`}
                                                pageNumber={index + 1}
                                                className="mb-8 rounded-md shadow-2xl"
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                            />
                                        ))}
                                    </Document>
                                )}

                                {contentType && contentType.includes("image") && fileUrl && (
                                    <div className="relative w-full h-full flex justify-center items-center overflow-hidden">
                                        <img
                                            src={fileUrl}
                                            alt="Secure Document"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                maxWidth: '95vw',
                                                maxHeight: '85vh',
                                                objectFit: 'contain',
                                                boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                                                border: '1px solid #333',
                                                userSelect: 'none',
                                                WebkitUserDrag: 'none',
                                                position: 'relative',
                                                zIndex: 1
                                            }}
                                            className="rounded-lg"
                                            onDragStart={(e) => e.preventDefault()}
                                            onContextMenu={(e) => e.preventDefault()}
                                        />

                                        {/* CSS Watermark Overlay specifically for User B Images */}
                                        {!isNativeOwnerView && (
                                            <div
                                                className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden"
                                                style={{ zIndex: 9999, mixBlendMode: 'normal' }}
                                            >
                                                <div
                                                    className="select-none flex flex-wrap justify-center items-center content-center h-[200%] w-[200%] -rotate-45"
                                                    style={{
                                                        opacity: (customWatermark?.opacity ?? 20) / 100
                                                    }}
                                                >
                                                    {/* Repeat the watermark string dramatically to tile it */}
                                                    {Array(Number(customWatermark?.density) || 100).fill(customWatermark?.text || "SECURE VIEW").map((text, idx) => (
                                                        <span key={idx} style={{
                                                            color: 'rgba(255, 255, 255, 0.2)',
                                                            fontSize: `${customWatermark?.size ?? 12}px`,
                                                            margin: '10px',
                                                            fontWeight: 'bold',
                                                            letterSpacing: '0.1em'
                                                        }}>
                                                            {text}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {contentType && contentType.includes("text") && fileContent && (
                                    <div className="w-full text-left bg-slate-950/50 p-6 rounded-lg border border-slate-800 shadow-inner overflow-x-auto max-h-[80vh] overflow-y-auto">
                                        <pre className="text-slate-300 font-mono text-sm whitespace-pre-wrap">{fileContent}</pre>
                                    </div>
                                )}
                            </div>

                            {/* Floating Time Remaining Badge */}
                            {timeRemaining && (
                                <div className="fixed bottom-6 right-6 z-[100] bg-slate-900/90 backdrop-blur-md border border-slate-700 p-3 rounded-2xl shadow-2xl flex items-center gap-3">
                                    <div className="p-2 bg-yellow-500/20 rounded-xl">
                                        <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />
                                    </div>
                                    <div className="flex flex-col pr-2">
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Session Time Limit</span>
                                        <span className="font-mono text-xl text-yellow-400 font-black tracking-widest">
                                            {timeRemaining}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </main>
            </div>
        </PageTransition>
    );
};

export default PublicViewer;
