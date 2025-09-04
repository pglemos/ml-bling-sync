"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shared/card";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { Label } from "@/components/shared/label";
import { Textarea } from "@/components/shared/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shared/select";
import { Checkbox } from "@/components/shared/checkbox";
import { Badge } from "@/components/shared/badge";
import { Separator } from "@/components/shared/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/shared/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/shared/tooltip";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import { useToast } from "@/components/shared/use-toast";

type AttributeType = "text" | "number" | "select" | "multiselect" | "boolean" | "textarea";

interface AttributeOption {
  value: string;
  label: string;
}

interface ChannelAttribute {
  id: string;
  name: string;
  type: AttributeType;
  required: boolean;
  description?: string;
  options?: AttributeOption[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  defaultValue?: any;
  placeholder?: string;
  group?: string;
}

interface AttributeValue {
  attributeId: string;
  value: any;
  isValid: boolean;
  error?: string;
}

interface ChannelAttributesEditorProps {
  selectedMarketplaces: string[];
  attributes: Record<string, any>;
  onAttributesChange: (attributes: Record<string, any>) => void;
  errors?: Record<string, string>;
  category?: string;
  productId?: string;
}

// Mock data for marketplace attributes
const MARKETPLACE_ATTRIBUTES: Record<string, ChannelAttribute[]> = {
  mercadolivre: [
    {
      id: "brand",
      name: "Marca",
      type: "select",
      required: true,
      description: "Marca do produto conforme catálogo do Mercado Livre",
      options: [
        { value: "samsung", label: "Samsung" },
        { value: "apple", label: "Apple" },
        { value: "xiaomi", label: "Xiaomi" },
        { value: "motorola", label: "Motorola" },
      ],
      group: "Informações Básicas",
    },
    {
      id: "model",
      name: "Modelo",
      type: "text",
      required: true,
      description: "Modelo específico do produto",
      validation: {
        min: 2,
        max: 100,
        message: "O modelo deve ter entre 2 e 100 caracteres",
      },
      placeholder: "Ex: Galaxy A54 5G",
      group: "Informações Básicas",
    },
    {
      id: "warranty",
      name: "Garantia (meses)",
      type: "number",
      required: true,
      description: "Período de garantia em meses",
      validation: {
        min: 1,
        max: 60,
        message: "A garantia deve ser entre 1 e 60 meses",
      },
      defaultValue: 12,
      group: "Garantia e Suporte",
    },
    {
      id: "color",
      name: "Cor",
      type: "select",
      required: false,
      description: "Cor principal do produto",
      options: [
        { value: "black", label: "Preto" },
        { value: "white", label: "Branco" },
        { value: "blue", label: "Azul" },
        { value: "red", label: "Vermelho" },
        { value: "green", label: "Verde" },
      ],
      group: "Características",
    },
    {
      id: "features",
      name: "Características Especiais",
      type: "multiselect",
      required: false,
      description: "Características especiais do produto",
      options: [
        { value: "waterproof", label: "À prova d'água" },
        { value: "wireless_charging", label: "Carregamento sem fio" },
        { value: "fast_charging", label: "Carregamento rápido" },
        { value: "dual_sim", label: "Dual SIM" },
      ],
      group: "Características",
    },
    {
      id: "technical_specs",
      name: "Especificações Técnicas",
      type: "textarea",
      required: false,
      description: "Especificações técnicas detalhadas",
      validation: {
        max: 1000,
        message: "As especificações devem ter no máximo 1000 caracteres",
      },
      placeholder: "Descreva as especificações técnicas do produto...",
      group: "Detalhes Técnicos",
    },
  ],
  shopee: [
    {
      id: "brand",
      name: "Marca",
      type: "text",
      required: true,
      description: "Nome da marca do produto",
      validation: {
        min: 2,
        max: 50,
        message: "A marca deve ter entre 2 e 50 caracteres",
      },
      group: "Informações Básicas",
    },
    {
      id: "condition",
      name: "Condição",
      type: "select",
      required: true,
      description: "Condição do produto",
      options: [
        { value: "new", label: "Novo" },
        { value: "used", label: "Usado" },
        { value: "refurbished", label: "Recondicionado" },
      ],
      defaultValue: "new",
      group: "Informações Básicas",
    },
    {
      id: "weight",
      name: "Peso (kg)",
      type: "number",
      required: true,
      description: "Peso do produto em quilogramas",
      validation: {
        min: 0.01,
        max: 100,
        message: "O peso deve ser entre 0.01 e 100 kg",
      },
      group: "Dimensões e Peso",
    },
    {
      id: "dimensions",
      name: "Dimensões (cm)",
      type: "text",
      required: false,
      description: "Dimensões do produto (LxAxP)",
      placeholder: "Ex: 15.5 x 7.6 x 0.8",
      validation: {
        pattern: "^\\d+(\\.\\d+)?\\s*x\\s*\\d+(\\.\\d+)?\\s*x\\s*\\d+(\\.\\d+)?$",
        message: "Use o formato: LarguraxAlturaxProfundidade (ex: 15.5 x 7.6 x 0.8)",
      },
      group: "Dimensões e Peso",
    },
    {
      id: "origin_country",
      name: "País de Origem",
      type: "select",
      required: true,
      description: "País onde o produto foi fabricado",
      options: [
        { value: "BR", label: "Brasil" },
        { value: "CN", label: "China" },
        { value: "US", label: "Estados Unidos" },
        { value: "KR", label: "Coreia do Sul" },
        { value: "JP", label: "Japão" },
      ],
      group: "Origem e Certificações",
    },
  ],
};

const AttributeField: React.FC<{
  attribute: ChannelAttribute;
  value: any;
  error?: string;
  onChange: (value: any) => void;
}> = ({ attribute, value, error, onChange }) => {
  const renderField = () => {
    switch (attribute.type) {
      case "text":
        return (
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={attribute.placeholder}
            className={error ? "border-red-500" : ""}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            placeholder={attribute.placeholder}
            min={attribute.validation?.min}
            max={attribute.validation?.max}
            className={error ? "border-red-500" : ""}
          />
        );

      case "textarea":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={attribute.placeholder}
            className={error ? "border-red-500" : ""}
            rows={4}
          />
        );

      case "select":
        return (
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger className={error ? "border-red-500" : ""}>
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent>
              {attribute.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multiselect":
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {attribute.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${attribute.id}-${option.value}`}
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selectedValues, option.value]);
                    } else {
                      onChange(selectedValues.filter((v) => v !== option.value));
                    }
                  }}
                />
                <Label htmlFor={`${attribute.id}-${option.value}`}>
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        );

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={attribute.id}
              checked={value || false}
              onCheckedChange={onChange}
            />
            <Label htmlFor={attribute.id}>Sim</Label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">
          {attribute.name}
          {attribute.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {attribute.description && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{attribute.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {renderField()}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
};

export const ChannelAttributesEditor: React.FC<ChannelAttributesEditorProps> = ({
  selectedMarketplaces,
  attributes: externalAttributes,
  onAttributesChange,
  errors: externalErrors = {},
  category,
  productId,
}) => {
  const [attributes, setAttributes] = useState<ChannelAttribute[]>([]);
  const [values, setValues] = useState<Record<string, any>>(externalAttributes);
  const [errors, setErrors] = useState<Record<string, string>>(externalErrors);
  const [isLoading, setIsLoading] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load attributes for all selected marketplaces
    const allAttributes: ChannelAttribute[] = [];
    selectedMarketplaces.forEach(marketplace => {
      const marketplaceAttrs = MARKETPLACE_ATTRIBUTES[marketplace] || [];
      marketplaceAttrs.forEach(attr => {
        allAttributes.push({
          ...attr,
          id: `${marketplace}_${attr.id}`,
          name: `${attr.name} (${marketplace})`,
          group: `${marketplace} - ${attr.group || 'Geral'}`
        });
      });
    });
    setAttributes(allAttributes);

    // Set default values
    const defaultValues = { ...externalAttributes };
    allAttributes.forEach((attr) => {
      if (attr.defaultValue !== undefined && !defaultValues[attr.id]) {
        defaultValues[attr.id] = attr.defaultValue;
      }
    });
    setValues(defaultValues);
  }, [selectedMarketplaces, category, externalAttributes]);

  const validateAttribute = (attribute: ChannelAttribute, value: any): string | null => {
    if (attribute.required && (!value || (Array.isArray(value) && value.length === 0))) {
      return "Este campo é obrigatório";
    }

    if (!value) return null;

    const validation = attribute.validation;
    if (!validation) return null;

    if (attribute.type === "text" || attribute.type === "textarea") {
      const strValue = String(value);
      if (validation.min && strValue.length < validation.min) {
        return validation.message || `Mínimo de ${validation.min} caracteres`;
      }
      if (validation.max && strValue.length > validation.max) {
        return validation.message || `Máximo de ${validation.max} caracteres`;
      }
      if (validation.pattern && !new RegExp(validation.pattern).test(strValue)) {
        return validation.message || "Formato inválido";
      }
    }

    if (attribute.type === "number") {
      const numValue = Number(value);
      if (validation.min && numValue < validation.min) {
        return validation.message || `Valor mínimo: ${validation.min}`;
      }
      if (validation.max && numValue > validation.max) {
        return validation.message || `Valor máximo: ${validation.max}`;
      }
    }

    return null;
  };

  const handleValueChange = (attributeId: string, value: any) => {
    const newValues = { ...values, [attributeId]: value };
    setValues(newValues);
    onAttributesChange(newValues);

    // Clear error when user starts typing
    if (errors[attributeId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[attributeId];
        return newErrors;
      });
    }
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    attributes.forEach((attribute) => {
      const error = validateAttribute(attribute, values[attribute.id]);
      if (error) {
        newErrors[attribute.id] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleReset = () => {
    const defaultValues: Record<string, any> = {};
    attributes.forEach((attr) => {
      if (attr.defaultValue !== undefined) {
        defaultValues[attr.id] = attr.defaultValue;
      }
    });
    const newValues = { ...externalAttributes, ...defaultValues };
    setValues(newValues);
    onAttributesChange(newValues);
    setErrors({});
  };

  // Group attributes by group
  const groupedAttributes = attributes.reduce((acc, attr) => {
    const group = attr.group || "Outros";
    if (!acc[group]) acc[group] = [];
    acc[group].push(attr);
    return acc;
  }, {} as Record<string, ChannelAttribute[]>);

  const requiredAttributes = attributes.filter((attr) => attr.required);
  const optionalAttributes = attributes.filter((attr) => !attr.required);
  const completedRequired = requiredAttributes.filter((attr) => {
    const value = values[attr.id];
    return value && (!Array.isArray(value) || value.length > 0);
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Atributos por Marketplace</h3>
          <p className="text-sm text-muted-foreground">
            Configure os atributos específicos para cada marketplace selecionado
            {category && ` na categoria ${category}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {completedRequired}/{requiredAttributes.length} obrigatórios
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOptional(!showOptional)}
          >
            {showOptional ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showOptional ? "Ocultar" : "Mostrar"} opcionais
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progresso dos campos obrigatórios</span>
          <span>{Math.round((completedRequired / requiredAttributes.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedRequired / requiredAttributes.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Check if no marketplaces selected */}
      {selectedMarketplaces.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum marketplace selecionado</p>
            <p className="text-sm text-muted-foreground mt-2">Volte à etapa anterior para selecionar os marketplaces</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Attributes */}
          <div className="space-y-4">
            <Accordion type="multiple">
          {Object.entries(groupedAttributes).map(([group, groupAttrs]) => {
            const visibleAttrs = groupAttrs.filter(
              (attr) => attr.required || showOptional
            );

            if (visibleAttrs.length === 0) return null;

            const groupErrors = visibleAttrs.filter((attr) => errors[attr.id]).length;
            const groupCompleted = visibleAttrs.filter((attr) => {
              const value = values[attr.id];
              return value && (!Array.isArray(value) || value.length > 0);
            }).length;

            return (
              <AccordionItem key={group} value={group}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full mr-4">
                    <span className="font-medium">{group}</span>
                    <div className="flex items-center gap-2">
                      {groupErrors > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {groupErrors} erro{groupErrors > 1 ? "s" : ""}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {groupCompleted}/{visibleAttrs.length}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 pt-4">
                    {visibleAttrs.map((attribute) => (
                      <motion.div
                        key={attribute.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <AttributeField
                          attribute={attribute}
                          value={values[attribute.id]}
                          error={errors[attribute.id]}
                          onChange={(value) => handleValueChange(attribute.id, value)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
            </Accordion>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end pt-6 border-t">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetar Valores
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChannelAttributesEditor;
