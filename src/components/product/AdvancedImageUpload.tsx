"use client";

import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/shared/button";
import { Badge } from "@/components/shared/badge";
import { Card, CardContent } from "@/components/shared/card";
import { Progress } from "@/components/shared/progress";
import { useToast } from "@/components/shared/use-toast";
import { 
  Upload, 
  X, 
  GripVertical,
  Trash2,
  Eye,
  Star,
  StarOff,
  Wand2,
  Download,
  RotateCw,
  Crop,
  Palette,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export type UploadedImage = {
  id: string;
  file: File;
  preview: string;
  isPrimary?: boolean;
  isProcessing?: boolean;
  hasBackgroundRemoved?: boolean;
  processingProgress?: number;
};

interface AdvancedImageUploadProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxFiles?: number;
  className?: string;
  error?: string;
}

// Sortable Image Component with Advanced Features
function SortableImageCard({ 
  image, 
  onRemove, 
  onSetPrimary, 
  onRemoveBackground,
  onPreview 
}: { 
  image: UploadedImage; 
  onRemove: (id: string) => void;
  onSetPrimary: (id: string) => void;
  onRemoveBackground: (id: string) => void;
  onPreview: (image: UploadedImage) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`relative group bg-white border-2 rounded-xl overflow-hidden transition-all duration-200 ${
        image.isPrimary 
          ? 'border-primary ring-2 ring-primary/20' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="relative aspect-square">
        {/* Image */}
        <img
          src={image.preview}
          alt="Product preview"
          className="w-full h-full object-cover"
        />
        
        {/* Processing Overlay */}
        {image.isProcessing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm font-medium">Processando...</p>
              {image.processingProgress && (
                <Progress 
                  value={image.processingProgress} 
                  className="w-20 mt-2 mx-auto"
                />
              )}
            </div>
          </div>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
        
        {/* Primary Badge */}
        {image.isPrimary && (
          <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
            <Star className="w-3 h-3 mr-1" />
            Principal
          </Badge>
        )}
        
        {/* Background Removed Badge */}
        {image.hasBackgroundRemoved && (
          <Badge className="absolute top-2 right-2 bg-green-500 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sem fundo
          </Badge>
        )}
        
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        >
          <GripVertical className="w-4 h-4 text-gray-600" />
        </div>
        
        {/* Action Buttons */}
        <div className="absolute bottom-2 left-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Preview Button */}
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 h-8 text-xs bg-white/90 backdrop-blur-sm hover:bg-white"
            onClick={() => onPreview(image)}
          >
            <Eye className="w-3 h-3 mr-1" />
            Ver
          </Button>
          
          {/* Set Primary Button */}
          <Button
            variant="secondary"
            size="sm"
            className="h-8 px-2 bg-white/90 backdrop-blur-sm hover:bg-white"
            onClick={() => onSetPrimary(image.id)}
            disabled={image.isPrimary}
          >
            {image.isPrimary ? (
              <Star className="w-3 h-3 fill-current" />
            ) : (
              <StarOff className="w-3 h-3" />
            )}
          </Button>
          
          {/* Remove Background Button */}
          <Button
            variant="secondary"
            size="sm"
            className="h-8 px-2 bg-white/90 backdrop-blur-sm hover:bg-white"
            onClick={() => onRemoveBackground(image.id)}
            disabled={image.isProcessing || image.hasBackgroundRemoved}
          >
            <Wand2 className="w-3 h-3" />
          </Button>
          
          {/* Remove Button */}
          <Button
            variant="destructive"
            size="sm"
            className="h-8 px-2"
            onClick={() => onRemove(image.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Image Preview Modal
function ImagePreviewModal({ 
  image, 
  isOpen, 
  onClose 
}: { 
  image: UploadedImage | null; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  if (!image || !isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <img
            src={image.preview}
            alt="Preview"
            className="w-full h-auto max-h-[80vh] object-contain"
          />
          
          {/* Close Button */}
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-4 right-4"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
          
          {/* Image Info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="text-white">
              <p className="font-medium">{image.file.name}</p>
              <p className="text-sm opacity-90">
                {(image.file.size / 1024 / 1024).toFixed(2)} MB • {image.file.type}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function AdvancedImageUpload({ 
  images, 
  onImagesChange, 
  maxFiles = 10, 
  className = "",
  error 
}: AdvancedImageUploadProps) {
  const [previewImage, setPreviewImage] = useState<UploadedImage | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { toast } = useToast();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    maxFiles: maxFiles - images.length,
    onDrop: useCallback((acceptedFiles) => {
      const newImages = acceptedFiles.map((file, index) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        isPrimary: images.length === 0 && index === 0, // First image is primary if no images exist
        isProcessing: false,
        hasBackgroundRemoved: false
      }));
      
      onImagesChange([...images, ...newImages]);
      
      toast({
        title: "Imagens adicionadas",
        description: `${newImages.length} imagem(ns) adicionada(s) com sucesso`,
      });
    }, [images, onImagesChange, toast]),
    onDropRejected: (rejectedFiles) => {
      toast({
        title: "Arquivos rejeitados",
        description: "Apenas imagens são aceitas (JPEG, PNG, WebP, GIF)",
        variant: "destructive"
      });
    }
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = images.findIndex(item => item.id === active.id);
      const newIndex = images.findIndex(item => item.id === over.id);
      const newImages = arrayMove(images, oldIndex, newIndex);
      onImagesChange(newImages);
    }
  };

  const removeImage = useCallback((id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
      const newImages = images.filter(img => img.id !== id);
      
      // If removed image was primary, set first image as primary
      if (imageToRemove.isPrimary && newImages.length > 0) {
        newImages[0].isPrimary = true;
      }
      
      onImagesChange(newImages);
    }
  }, [images, onImagesChange]);

  const setPrimaryImage = useCallback((id: string) => {
    const newImages = images.map(img => ({
      ...img,
      isPrimary: img.id === id
    }));
    onImagesChange(newImages);
    
    toast({
      title: "Imagem principal definida",
      description: "Esta imagem será exibida como principal nos marketplaces",
    });
  }, [images, onImagesChange, toast]);

  const removeBackground = useCallback(async (id: string) => {
    const imageIndex = images.findIndex(img => img.id === id);
    if (imageIndex === -1) return;

    // Start processing
    const newImages = [...images];
    newImages[imageIndex] = {
      ...newImages[imageIndex],
      isProcessing: true,
      processingProgress: 0
    };
    onImagesChange(newImages);

    toast({
      title: "Removendo fundo",
      description: "Processando imagem com IA...",
    });

    // Simulate AI processing with progress
    const progressInterval = setInterval(() => {
      const currentImages = [...newImages];
      const currentProgress = currentImages[imageIndex].processingProgress || 0;
      
      if (currentProgress < 90) {
        currentImages[imageIndex].processingProgress = currentProgress + 10;
        onImagesChange(currentImages);
      }
    }, 200);

    // Simulate completion after 2 seconds
    setTimeout(() => {
      clearInterval(progressInterval);
      
      const finalImages = [...newImages];
      finalImages[imageIndex] = {
        ...finalImages[imageIndex],
        isProcessing: false,
        hasBackgroundRemoved: true,
        processingProgress: 100
      };
      onImagesChange(finalImages);
      
      toast({
        title: "Fundo removido",
        description: "Imagem processada com sucesso!",
      });
    }, 2000);
  }, [images, onImagesChange, toast]);

  const openPreview = useCallback((image: UploadedImage) => {
    setPreviewImage(image);
    setIsPreviewOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setIsPreviewOpen(false);
    setPreviewImage(null);
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${error ? 'border-destructive bg-destructive/5' : ''}
          ${images.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} disabled={images.length >= maxFiles} />
        
        <motion.div
          animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Upload className={`w-16 h-16 mx-auto mb-4 ${
            isDragActive ? 'text-primary' : 'text-gray-400'
          }`} />
          
          <h3 className="text-xl font-semibold mb-2">
            {isDragActive 
              ? 'Solte as imagens aqui' 
              : images.length >= maxFiles
                ? 'Limite de imagens atingido'
                : 'Adicionar imagens'
            }
          </h3>
          
          <p className="text-gray-600 mb-4">
            {images.length >= maxFiles 
              ? `Máximo de ${maxFiles} imagens permitidas`
              : `Arraste e solte ou clique para selecionar (${images.length}/${maxFiles})`
            }
          </p>
          
          <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
            <Badge variant="outline">JPEG</Badge>
            <Badge variant="outline">PNG</Badge>
            <Badge variant="outline">WebP</Badge>
            <Badge variant="outline">GIF</Badge>
          </div>
        </motion.div>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      
      {/* Images Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-lg">
              Imagens ({images.length}/{maxFiles})
            </h4>
            
            <div className="flex gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                Principal
              </div>
              <div className="flex items-center gap-1">
                <Wand2 className="w-4 h-4" />
                Sem fundo
              </div>
            </div>
          </div>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={images.map(img => img.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <AnimatePresence>
                  {images.map((image) => (
                    <SortableImageCard
                      key={image.id}
                      image={image}
                      onRemove={removeImage}
                      onSetPrimary={setPrimaryImage}
                      onRemoveBackground={removeBackground}
                      onPreview={openPreview}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
      
      {/* Image Preview Modal */}
      <AnimatePresence>
        <ImagePreviewModal
          image={previewImage}
          isOpen={isPreviewOpen}
          onClose={closePreview}
        />
      </AnimatePresence>
    </div>
  );
}
