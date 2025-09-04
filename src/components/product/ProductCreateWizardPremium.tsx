"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/shared/use-toast";
import { ChannelAttributesEditor } from "./ChannelAttributesEditor";
import { AdvancedImageUpload, UploadedImage } from "./AdvancedImageUpload";


import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/shared/dialog";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { Label } from "@/components/shared/label";
import { Textarea } from "@/components/shared/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shared/select";
import { Badge } from "@/components/shared/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared/card";
import { Progress } from "@/components/shared/progress";
import { Checkbox } from "@/components/shared/checkbox";
import { Separator } from "@/components/shared/separator";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  DollarSign, 
  Image as ImageIcon, 
  Check,
  Settings,
  Calculator,
  Send,
  AlertTriangle,
  Info,
  TrendingUp,
  ShoppingCart
} from "lucide-react";

type ProductFormData = {
  name: string;
  sku: string;
  category: string;
  price: string;
  stock: string;
  description: string;
  images: File[];
  ncm?: string;
  origin?: string;
  marketplaces: string[];
  attributes: Record<string, any>;
  simulation: {
    marketplace: string;
    fees: Record<string, number>;
    margins: Record<string, number>;
    finalPrice: number;
  };
};

// UploadedImage type is now imported from AdvancedImageUpload

interface ProductCreateWizardPremiumProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductFormData) => void;
  isLoading?: boolean;
}

const STEPS = [
  { id: 1, title: "Básico", icon: Package, description: "Informações essenciais" },
  { id: 2, title: "Preço & Estoque", icon: DollarSign, description: "Valores e quantidades" },
  { id: 3, title: "Imagens", icon: ImageIcon, description: "Fotos do produto" },
  { id: 4, title: "Atributos", icon: Settings, description: "Características específicas" },
  { id: 5, title: "Simulação", icon: Calculator, description: "Taxas e margens" },
  { id: 6, title: "Publicação", icon: Send, description: "Revisar e publicar" }
];

const CATEGORIES = [
  "Eletrônicos",
  "Informática",
  "Áudio",
  "TV e Vídeo",
  "Calçados",
  "Eletrodomésticos",
  "Casa e Jardim",
  "Moda",
  "Esportes",
  "Livros",
  "Outros"
];

const MARKETPLACES = [
  { 
    id: "mercadolivre", 
    name: "Mercado Livre", 
    color: "bg-yellow-500",
    fees: { listing: 0, success: 11.5, payment: 4.99 },
    attributes: [
      { key: "brand", label: "Marca", type: "text", required: true },
      { key: "model", label: "Modelo", type: "text", required: true },
      { key: "warranty", label: "Garantia (meses)", type: "number", required: false },
      { key: "condition", label: "Condição", type: "select", options: ["Novo", "Usado", "Recondicionado"], required: true }
    ]
  },
  { 
    id: "shopee", 
    name: "Shopee", 
    color: "bg-orange-500",
    fees: { listing: 0, success: 8.5, payment: 3.99 },
    attributes: [
      { key: "brand", label: "Marca", type: "text", required: true },
      { key: "weight", label: "Peso (kg)", type: "number", required: true },
      { key: "dimensions", label: "Dimensões (cm)", type: "text", required: false },
      { key: "material", label: "Material", type: "text", required: false }
    ]
  },
  { 
    id: "amazon", 
    name: "Amazon", 
    color: "bg-orange-400",
    fees: { listing: 0, success: 15, payment: 2.99 },
    attributes: [
      { key: "brand", label: "Marca", type: "text", required: true },
      { key: "asin", label: "ASIN", type: "text", required: false },
      { key: "bullet_points", label: "Pontos Principais", type: "textarea", required: true },
      { key: "keywords", label: "Palavras-chave", type: "text", required: false }
    ]
  },
  { 
    id: "magalu", 
    name: "Magazine Luiza", 
    color: "bg-blue-600",
    fees: { listing: 0, success: 12, payment: 4.49 },
    attributes: [
      { key: "brand", label: "Marca", type: "text", required: true },
      { key: "ean", label: "EAN", type: "text", required: false },
      { key: "technical_specs", label: "Especificações Técnicas", type: "textarea", required: false }
    ]
  }
];

// SortableImage component is now part of AdvancedImageUpload

// Fee Simulation Component
function FeeSimulation({ 
  marketplace, 
  price, 
  onSimulationChange 
}: { 
  marketplace: any; 
  price: number; 
  onSimulationChange: (simulation: any) => void; 
}) {
  const [customMargin, setCustomMargin] = useState(30);
  
  const simulation = useMemo(() => {
    const listingFee = (price * marketplace.fees.listing) / 100;
    const successFee = (price * marketplace.fees.success) / 100;
    const paymentFee = marketplace.fees.payment;
    const totalFees = listingFee + successFee + paymentFee;
    const netRevenue = price - totalFees;
    const suggestedPrice = price / (1 - (customMargin / 100));
    
    return {
      marketplace: marketplace.id,
      fees: {
        listing: listingFee,
        success: successFee,
        payment: paymentFee,
        total: totalFees
      },
      margins: {
        custom: customMargin,
        net: ((netRevenue - price) / price) * 100
      },
      finalPrice: suggestedPrice,
      netRevenue
    };
  }, [marketplace, price, customMargin]);
  
  React.useEffect(() => {
    onSimulationChange(simulation);
  }, [simulation, onSimulationChange]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${marketplace.color}`} />
          {marketplace.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Preço Base</Label>
            <div className="text-lg font-semibold">R$ {price.toFixed(2)}</div>
          </div>
          <div>
            <Label>Margem Desejada (%)</Label>
            <Input
              type="number"
              value={customMargin}
              onChange={(e) => setCustomMargin(Number(e.target.value))}
              className="mt-1"
            />
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <h4 className="font-medium">Taxas do Marketplace</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Taxa de Listagem: R$ {simulation.fees.listing.toFixed(2)}</div>
            <div>Taxa de Sucesso: R$ {simulation.fees.success.toFixed(2)}</div>
            <div>Taxa de Pagamento: R$ {simulation.fees.payment.toFixed(2)}</div>
            <div className="font-semibold">Total: R$ {simulation.fees.total.toFixed(2)}</div>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <h4 className="font-medium">Resultado</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Receita Líquida: R$ {simulation.netRevenue.toFixed(2)}</div>
            <div className="font-semibold text-green-600">
              Preço Sugerido: R$ {simulation.finalPrice.toFixed(2)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const ProductCreateWizardPremium = React.memo(function ProductCreateWizardPremium({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading = false 
}: ProductCreateWizardPremiumProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    sku: "",
    category: "",
    price: "",
    stock: "",
    description: "",
    images: [],
    ncm: "",
    origin: "Nacional",
    marketplaces: [],
    attributes: {},
    simulation: {
      marketplace: "",
      fees: {},
      margins: {},
      finalPrice: 0
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedMarketplaceForSim, setSelectedMarketplaceForSim] = useState("");
  const { toast } = useToast();

  // Image handling is now managed by AdvancedImageUpload component

  // Image removal is now handled by AdvancedImageUpload component

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = "Nome é obrigatório";
        if (!formData.sku.trim()) newErrors.sku = "SKU é obrigatório";
        if (!formData.category) newErrors.category = "Categoria é obrigatória";
        break;
      case 2:
        if (!formData.price || parseFloat(formData.price) <= 0) {
          newErrors.price = "Preço deve ser maior que zero";
        }
        if (!formData.stock || parseInt(formData.stock) < 0) {
          newErrors.stock = "Estoque deve ser um número válido";
        }
        break;
      case 3:
        if (images.length === 0) {
          newErrors.images = "Pelo menos uma imagem é obrigatória";
        }
        break;
      case 4:
        // Validate marketplace-specific attributes
        formData.marketplaces.forEach(marketplaceId => {
          const marketplace = MARKETPLACES.find(m => m.id === marketplaceId);
          if (marketplace) {
            marketplace.attributes.forEach(attr => {
              if (attr.required && !formData.attributes[`${marketplaceId}_${attr.key}`]) {
                newErrors[`${marketplaceId}_${attr.key}`] = `${attr.label} é obrigatório para ${marketplace.name}`;
              }
            });
          }
        });
        break;
      case 5:
        if (formData.marketplaces.length > 0 && !selectedMarketplaceForSim) {
          newErrors.simulation = "Selecione um marketplace para simulação";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(currentStep)) return;

    const submitData = {
      ...formData,
      images: images.map(img => img.file)
    };

    onSubmit(submitData);
  }, [currentStep, formData, images, onSubmit]);

  const handleClose = () => {
    // Clean up image previews
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setFormData({
      name: "",
      sku: "",
      category: "",
      price: "",
      stock: "",
      description: "",
      images: [],
      ncm: "",
      origin: "Nacional",
      marketplaces: [],
      attributes: {},
      simulation: {
        marketplace: "",
        fees: {},
        margins: {},
        finalPrice: 0
      }
    });
    setCurrentStep(1);
    setErrors({});
    setSelectedMarketplaceForSim("");
    onOpenChange(false);
  };

  const toggleMarketplace = (marketplaceId: string) => {
    setFormData(prev => ({
      ...prev,
      marketplaces: prev.marketplaces.includes(marketplaceId)
        ? prev.marketplaces.filter(id => id !== marketplaceId)
        : [...prev.marketplaces, marketplaceId]
    }));
  };

  const updateAttribute = (marketplaceId: string, key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [`${marketplaceId}_${key}`]: value
      }
    }));
  };

  const handleSimulationChange = (simulation: any) => {
    setFormData(prev => ({
      ...prev,
      simulation
    }));
  };

  const progress = (currentStep / STEPS.length) * 100;
  const selectedMarketplace = MARKETPLACES.find(m => m.id === selectedMarketplaceForSim);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Criar Novo Produto - Premium</DialogTitle>
          <DialogDescription>
            Wizard completo para criação de produtos com simulação de taxas e atributos por marketplace
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Etapa {currentStep} de {STEPS.length}</span>
            <span>{Math.round(progress)}% concluído</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-6">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center space-y-2 flex-1">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
                  ${isActive ? 'border-primary bg-primary text-primary-foreground' : ''}
                  ${isCompleted ? 'border-green-500 bg-green-500 text-white' : ''}
                  ${!isActive && !isCompleted ? 'border-muted-foreground text-muted-foreground' : ''}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <span className={`text-xs font-medium ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Produto *</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Smartphone Samsung Galaxy A54"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className={errors.name ? "border-destructive" : ""}
                      />
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU *</Label>
                      <Input
                        id="sku"
                        placeholder="Ex: SAM-A54-128"
                        value={formData.sku}
                        onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                        className={errors.sku ? "border-destructive" : ""}
                      />
                      {errors.sku && <p className="text-sm text-destructive">{errors.sku}</p>}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      placeholder="Descrição detalhada do produto..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Price & Inventory */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Preço (R$) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        className={errors.price ? "border-destructive" : ""}
                      />
                      {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">Estoque *</Label>
                      <Input
                        id="stock"
                        type="number"
                        placeholder="0"
                        value={formData.stock}
                        onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                        className={errors.stock ? "border-destructive" : ""}
                      />
                      {errors.stock && <p className="text-sm text-destructive">{errors.stock}</p>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ncm">NCM</Label>
                      <Input
                        id="ncm"
                        placeholder="Ex: 8517.12.31"
                        value={formData.ncm}
                        onChange={(e) => setFormData(prev => ({ ...prev, ncm: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="origin">Origem</Label>
                      <Select value={formData.origin} onValueChange={(value) => setFormData(prev => ({ ...prev, origin: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Nacional">Nacional</SelectItem>
                          <SelectItem value="Importado">Importado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Marketplaces para Publicação</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {MARKETPLACES.map((marketplace) => (
                        <Card 
                          key={marketplace.id} 
                          className={`cursor-pointer transition-all ${
                            formData.marketplaces.includes(marketplace.id) 
                              ? 'ring-2 ring-primary bg-primary/5' 
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => toggleMarketplace(marketplace.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${marketplace.color}`} />
                              <span className="text-sm font-medium">{marketplace.name}</span>
                              {formData.marketplaces.includes(marketplace.id) && (
                                <Check className="w-4 h-4 text-primary ml-auto" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Images */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Imagens do Produto *</Label>
                    <p className="text-sm text-muted-foreground">
                      Adicione até 10 imagens com recursos avançados: drag & drop, reordenação, preview e remoção de fundo com IA.
                    </p>
                  </div>
                  
                  <AdvancedImageUpload
                    images={images}
                    onImagesChange={setImages}
                    maxFiles={10}
                    error={errors.images}
                  />
                </div>
              )}

              {/* Step 4: Marketplace Attributes */}
              {currentStep === 4 && (
                <ChannelAttributesEditor
                  selectedMarketplaces={formData.marketplaces}
                  attributes={formData.attributes}
                  onAttributesChange={(attributes) => {
                    setFormData(prev => ({
                      ...prev,
                      attributes
                    }));
                  }}
                  errors={errors}
                />
              )}

              {/* Step 5: Fee Simulation */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Simulação de Taxas e Margens</h3>
                    <p className="text-muted-foreground">Calcule as taxas e defina margens para otimizar seus preços</p>
                  </div>
                  
                  {formData.marketplaces.length === 0 ? (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Calculator className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Nenhum marketplace selecionado para simulação</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Selecione o Marketplace para Simulação</Label>
                        <Select value={selectedMarketplaceForSim} onValueChange={setSelectedMarketplaceForSim}>
                          <SelectTrigger className={errors.simulation ? "border-destructive" : ""}>
                            <SelectValue placeholder="Escolha um marketplace" />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.marketplaces.map(id => {
                              const marketplace = MARKETPLACES.find(m => m.id === id);
                              return marketplace ? (
                                <SelectItem key={id} value={id}>
                                  {marketplace.name}
                                </SelectItem>
                              ) : null;
                            })}
                          </SelectContent>
                        </Select>
                        {errors.simulation && <p className="text-sm text-destructive">{errors.simulation}</p>}
                      </div>
                      
                      {selectedMarketplace && formData.price && (
                        <FeeSimulation
                          marketplace={selectedMarketplace}
                          price={parseFloat(formData.price)}
                          onSimulationChange={handleSimulationChange}
                        />
                      )}
                      
                      {!formData.price && (
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Info className="w-4 h-4" />
                              <span className="text-sm">Defina um preço na etapa anterior para ver a simulação</span>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 6: Review & Publish */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Revisar e Publicar</h3>
                    <p className="text-muted-foreground">Verifique todas as informações antes de criar o produto</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Informações Básicas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div><strong>Nome:</strong> {formData.name}</div>
                        <div><strong>SKU:</strong> {formData.sku}</div>
                        <div><strong>Categoria:</strong> {formData.category}</div>
                        {formData.description && (
                          <div><strong>Descrição:</strong> {formData.description.substring(0, 100)}{formData.description.length > 100 ? '...' : ''}</div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Preço & Estoque
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div><strong>Preço:</strong> R$ {parseFloat(formData.price || '0').toFixed(2)}</div>
                        <div><strong>Estoque:</strong> {formData.stock} unidades</div>
                        {formData.ncm && <div><strong>NCM:</strong> {formData.ncm}</div>}
                        <div><strong>Origem:</strong> {formData.origin}</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Marketplaces e Simulação
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <strong className="text-sm">Marketplaces Selecionados:</strong>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {formData.marketplaces.length > 0 ? (
                            formData.marketplaces.map(id => {
                              const marketplace = MARKETPLACES.find(m => m.id === id);
                              return marketplace ? (
                                <Badge key={id} variant="secondary">
                                  {marketplace.name}
                                </Badge>
                              ) : null;
                            })
                          ) : (
                            <span className="text-sm text-muted-foreground">Nenhum marketplace selecionado</span>
                          )}
                        </div>
                      </div>
                      
                      {formData.simulation.marketplace && (
                        <div>
                          <strong className="text-sm">Simulação:</strong>
                          <div className="text-sm text-muted-foreground mt-1">
                            Marketplace: {MARKETPLACES.find(m => m.id === formData.simulation.marketplace)?.name}<br/>
                            Preço Sugerido: R$ {formData.simulation.finalPrice.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Imagens ({images.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-6 gap-2">
                        {images.map((image, index) => (
                          <div key={image.id} className="relative aspect-square">
                            <img
                              src={image.preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover rounded border"
                            />
                            {index === 0 && (
                              <Badge className="absolute -top-2 -right-2 text-xs">Principal</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            
            {currentStep < STEPS.length ? (
              <Button onClick={nextStep}>
                Próximo
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? "Criando..." : "Criar Produto"}
                <Send className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
