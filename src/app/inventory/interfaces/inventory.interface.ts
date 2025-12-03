/**
 * Enums y tipos basados en el backend de inventory
 * 
 * REGLAS DE NEGOCIO IMPORTANTES:
 * 1. BEVERAGE y DISPOSABLE SOLO pueden usar unidad UNIDAD
 * 2. UNIDAD solo acepta cantidades ENTERAS (sin decimales)
 * 3. Las unidades tienen categorías: MASS, VOLUME, QUANTITY
 * 4. Solo unidades de la misma categoría pueden convertirse entre sí
 */

// Tipos de items en inventario (backend: InventoryType.java)
export enum InventoryType {
  INGREDIENT = 'INGREDIENT',   // Insumos usados en preparación (harina, tomate, etc.)
  BEVERAGE = 'BEVERAGE',       // Bebidas envasadas (Coca Cola, Jugo, etc.)
  DISPOSABLE = 'DISPOSABLE',   // Descartables
}

// Categorías de unidades de medida
export enum UnitCategory {
  MASS = 'MASS',       // Masa: MG, G, KG
  VOLUME = 'VOLUME',   // Volumen: ML, L
  QUANTITY = 'QUANTITY', // Cantidad: UNIDAD
}

// Unidades de medida (backend: UnitOfMeasure.java)
export enum UnitOfMeasure {
  MG = 'MG',       // Miligramos (base de masa)
  G = 'G',         // Gramos
  KG = 'KG',       // Kilogramos
  ML = 'ML',       // Mililitros (base de volumen)
  L = 'L',         // Litros
  UNIDAD = 'UNIDAD', // Unidades individuales
}

// Mapeo de unidad a categoría
export const UNIT_CATEGORY: Record<UnitOfMeasure, UnitCategory> = {
  [UnitOfMeasure.MG]: UnitCategory.MASS,
  [UnitOfMeasure.G]: UnitCategory.MASS,
  [UnitOfMeasure.KG]: UnitCategory.MASS,
  [UnitOfMeasure.ML]: UnitCategory.VOLUME,
  [UnitOfMeasure.L]: UnitCategory.VOLUME,
  [UnitOfMeasure.UNIDAD]: UnitCategory.QUANTITY,
};

// Factores de conversión a unidad base
export const CONVERSION_FACTORS: Record<UnitOfMeasure, number> = {
  [UnitOfMeasure.MG]: 1,           // Base de masa
  [UnitOfMeasure.G]: 1000,
  [UnitOfMeasure.KG]: 1000000,
  [UnitOfMeasure.ML]: 1,           // Base de volumen
  [UnitOfMeasure.L]: 1000,
  [UnitOfMeasure.UNIDAD]: 1,       // Base de cantidad
};

// Labels para mostrar en UI
export const INVENTORY_TYPE_LABELS: Record<InventoryType, string> = {
  [InventoryType.INGREDIENT]: 'Ingrediente',
  [InventoryType.BEVERAGE]: 'Bebida Envasada',
  [InventoryType.DISPOSABLE]: 'Descartable',
};

export const UNIT_OF_MEASURE_LABELS: Record<UnitOfMeasure, string> = {
  [UnitOfMeasure.MG]: 'Miligramos (mg)',
  [UnitOfMeasure.G]: 'Gramos (g)',
  [UnitOfMeasure.KG]: 'Kilogramos (kg)',
  [UnitOfMeasure.ML]: 'Mililitros (ml)',
  [UnitOfMeasure.L]: 'Litros (L)',
  [UnitOfMeasure.UNIDAD]: 'Unidades',
};

export const UNIT_OF_MEASURE_SYMBOLS: Record<UnitOfMeasure, string> = {
  [UnitOfMeasure.MG]: 'mg',
  [UnitOfMeasure.G]: 'g',
  [UnitOfMeasure.KG]: 'kg',
  [UnitOfMeasure.ML]: 'ml',
  [UnitOfMeasure.L]: 'L',
  [UnitOfMeasure.UNIDAD]: 'und',
};

/**
 * REGLA CRÍTICA DEL BACKEND:
 * - BEVERAGE y DISPOSABLE SOLO pueden usar UNIDAD
 * - INGREDIENT puede usar cualquier unidad
 */
export const ALLOWED_UNITS_BY_TYPE: Record<InventoryType, UnitOfMeasure[]> = {
  [InventoryType.INGREDIENT]: [
    UnitOfMeasure.MG,
    UnitOfMeasure.G,
    UnitOfMeasure.KG,
    UnitOfMeasure.ML,
    UnitOfMeasure.L,
    UnitOfMeasure.UNIDAD,
  ],
  [InventoryType.BEVERAGE]: [UnitOfMeasure.UNIDAD],     // SOLO UNIDAD
  [InventoryType.DISPOSABLE]: [UnitOfMeasure.UNIDAD],   // SOLO UNIDAD
};

/**
 * Unidades que requieren valores enteros (sin decimales)
 */
export const UNITS_REQUIRING_INTEGER: UnitOfMeasure[] = [UnitOfMeasure.UNIDAD];

/**
 * Verifica si dos unidades son compatibles (misma categoría)
 */
export function areUnitsCompatible(unit1: UnitOfMeasure, unit2: UnitOfMeasure): boolean {
  return UNIT_CATEGORY[unit1] === UNIT_CATEGORY[unit2];
}

/**
 * Obtiene todas las unidades compatibles con una unidad dada
 */
export function getCompatibleUnits(unit: UnitOfMeasure): UnitOfMeasure[] {
  const category = UNIT_CATEGORY[unit];
  return Object.entries(UNIT_CATEGORY)
    .filter(([_, cat]) => cat === category)
    .map(([u]) => u as UnitOfMeasure);
}

/**
 * Convierte una cantidad de una unidad a otra (deben ser compatibles)
 */
export function convertQuantity(
  quantity: number,
  fromUnit: UnitOfMeasure,
  toUnit: UnitOfMeasure
): number {
  if (!areUnitsCompatible(fromUnit, toUnit)) {
    throw new Error(
      `No se puede convertir de ${fromUnit} (${UNIT_CATEGORY[fromUnit]}) a ${toUnit} (${UNIT_CATEGORY[toUnit]}). Categorías incompatibles.`
    );
  }
  
  if (fromUnit === toUnit) return quantity;
  
  // Convertir a unidad base, luego a unidad destino
  const inBaseUnit = quantity * CONVERSION_FACTORS[fromUnit];
  return inBaseUnit / CONVERSION_FACTORS[toUnit];
}

/**
 * Request DTO para crear un item en inventario
 * Backend: InventoryRequestDto.java
 */
export interface InventoryRequest {
  name: string;
  quantity: number;
  type: InventoryType;
  unitOfMeasure: UnitOfMeasure;
}

/**
 * Response DTO del inventario
 * Backend: InventoryResponseDto.java
 */
export interface InventoryResponse {
  id: number;
  name: string;
  quantity: number;
  type: InventoryType;
  unitOfMeasure: UnitOfMeasure;
}

/**
 * Update DTO para actualizar un item (todos los campos opcionales)
 * Backend: InventoryUpdateDto.java
 */
export interface InventoryUpdate {
  name?: string;
  quantity?: number;
  type?: InventoryType;
  unitOfMeasure?: UnitOfMeasure;
}

/**
 * Filtro para búsqueda avanzada
 * Backend: InventoryFilterDto.java
 */
export interface InventoryFilter {
  type?: InventoryType;
  searchTerm?: string;
}

/**
 * Response paginado del backend
 */
export interface PaginatedInventoryResponse {
  content: InventoryResponse[];
  totalPages: number;
  totalElements: number;
  size: number;
  page: number;
  empty: boolean;
}

/**
 * Item de inventario con estado calculado para UI
 */
export interface InventoryItem extends InventoryResponse {
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

/**
 * Calcular estado del stock basado en cantidad
 */
export function calculateStockStatus(quantity: number, type: InventoryType): InventoryItem['status'] {
  if (quantity <= 0) return 'out-of-stock';
  
  // Umbrales diferentes según tipo
  const lowStockThreshold = type === InventoryType.INGREDIENT ? 10 : 5;
  
  if (quantity <= lowStockThreshold) return 'low-stock';
  return 'in-stock';
}

/**
 * Mapear response a item con estado
 */
export function mapToInventoryItem(response: InventoryResponse): InventoryItem {
  return {
    ...response,
    status: calculateStockStatus(response.quantity, response.type),
  };
}

// ===========================================
// Interfaces para ProductInventory (recetas)
// ===========================================

/**
 * Request para crear relación producto-inventario
 * Backend: ProductInventoryRequestDto.java
 */
export interface ProductInventoryRequest {
  quantity: number;
  unitOfMeasure: UnitOfMeasure;
  productId: number;
  inventoryId: number;
}

/**
 * Response de relación producto-inventario
 * Backend: ProductInventoryResponseDto.java
 */
export interface ProductInventoryResponse {
  id: number;
  quantity: number;
  unitOfMeasure: UnitOfMeasure;
  productId: number;
  productName: string;
  inventoryId: number;
  inventoryName: string;
  inventoryType: InventoryType;
  inventoryQuantityAvailable: number;
}

/**
 * Update para relación producto-inventario
 * Backend: ProductInventoryUpdateDto.java
 */
export interface ProductInventoryUpdate {
  quantity?: number;
  unitOfMeasure?: UnitOfMeasure;
}

// ===========================================
// Tipos para la vista unificada de inventario
// ===========================================

/**
 * Categorías de vista para el filtro principal
 */
export enum InventoryViewCategory {
  ALL = 'ALL',
  INSUMOS = 'INSUMOS',           // Todos los insumos (INGREDIENT + BEVERAGE + DISPOSABLE)
  PRODUCTOS = 'PRODUCTOS',       // Productos del menú
  // Subcategorías de insumos
  INGREDIENTES = 'INGREDIENTES',
  BEBIDAS_ENVASADAS = 'BEBIDAS_ENVASADAS',
  DESCARTABLES = 'DESCARTABLES',
  // Subcategorías de productos
  ENTRADAS = 'ENTRADAS',
  SEGUNDOS = 'SEGUNDOS',
  BEBIDAS_MENU = 'BEBIDAS_MENU',
  CARTA = 'CARTA',
}

export const VIEW_CATEGORY_LABELS: Record<InventoryViewCategory, string> = {
  [InventoryViewCategory.ALL]: 'Todos',
  [InventoryViewCategory.INSUMOS]: 'Insumos',
  [InventoryViewCategory.PRODUCTOS]: 'Productos',
  [InventoryViewCategory.INGREDIENTES]: 'Ingredientes',
  [InventoryViewCategory.BEBIDAS_ENVASADAS]: 'Bebidas Envasadas',
  [InventoryViewCategory.DESCARTABLES]: 'Descartables',
  [InventoryViewCategory.ENTRADAS]: 'Entradas',
  [InventoryViewCategory.SEGUNDOS]: 'Segundos',
  [InventoryViewCategory.BEBIDAS_MENU]: 'Bebidas',
  [InventoryViewCategory.CARTA]: 'Carta',
};

/**
 * Item unificado para mostrar en la tabla (puede ser insumo o producto)
 */
export interface UnifiedInventoryItem {
  id: number;
  name: string;
  itemType: 'inventory' | 'product';
  // Campos de insumo
  quantity?: number;
  unitOfMeasure?: UnitOfMeasure;
  inventoryType?: InventoryType;
  status?: InventoryItem['status'];
  // Campos de producto
  price?: number;
  description?: string;
  productTypeId?: number;
  productTypeName?: string;
  available?: boolean;
}

// ===========================================
// Funciones de validación (match backend)
// ===========================================

/**
 * Valida las reglas de tipo y unidad según el backend
 * REGLA: BEVERAGE y DISPOSABLE SOLO pueden usar UNIDAD
 * REGLA: UNIDAD solo acepta cantidades enteras
 */
export function validateTypeAndUnitConsistency(
  type: InventoryType,
  unit: UnitOfMeasure,
  quantity: number
): { valid: boolean; message?: string } {
  // Regla 1: BEVERAGE y DISPOSABLE solo pueden usar UNIDAD
  if (
    (type === InventoryType.BEVERAGE || type === InventoryType.DISPOSABLE) &&
    unit !== UnitOfMeasure.UNIDAD
  ) {
    return {
      valid: false,
      message: `${INVENTORY_TYPE_LABELS[type]} SOLO puede usar unidad de medida 'UNIDAD'. Se intentó usar '${UNIT_OF_MEASURE_SYMBOLS[unit]}'`,
    };
  }

  // Regla 2: UNIDAD solo acepta cantidades enteras
  if (unit === UnitOfMeasure.UNIDAD && !Number.isInteger(quantity)) {
    return {
      valid: false,
      message: `La unidad de medida 'UNIDAD' SOLO acepta cantidades enteras. Recibido: ${quantity} (tiene decimales)`,
    };
  }

  return { valid: true };
}

/**
 * Valida cambio de tipo según reglas del backend
 */
export function validateTypeChange(
  oldType: InventoryType,
  newType: InventoryType,
  currentUnit: UnitOfMeasure,
  quantity: number
): { valid: boolean; message?: string } {
  // Si cambias a BEVERAGE o DISPOSABLE, DEBE ser UNIDAD y cantidad entera
  if (newType === InventoryType.BEVERAGE || newType === InventoryType.DISPOSABLE) {
    if (currentUnit !== UnitOfMeasure.UNIDAD) {
      return {
        valid: false,
        message: `No se puede cambiar a ${INVENTORY_TYPE_LABELS[newType]} con unidad ${UNIT_OF_MEASURE_SYMBOLS[currentUnit]}. Debe ser UNIDAD`,
      };
    }

    if (!Number.isInteger(quantity)) {
      return {
        valid: false,
        message: `No se puede cambiar a ${INVENTORY_TYPE_LABELS[newType]} con cantidad decimal ${quantity}. Debe ser entero`,
      };
    }
  }

  return { valid: true };
}

/**
 * Valida cambio de unidad según reglas del backend
 */
export function validateUnitChange(
  type: InventoryType,
  oldUnit: UnitOfMeasure,
  newUnit: UnitOfMeasure,
  quantity: number
): { valid: boolean; message?: string } {
  // BEVERAGE/DISPOSABLE no pueden cambiar a otra unidad que no sea UNIDAD
  if (
    (type === InventoryType.BEVERAGE || type === InventoryType.DISPOSABLE) &&
    newUnit !== UnitOfMeasure.UNIDAD
  ) {
    return {
      valid: false,
      message: `${INVENTORY_TYPE_LABELS[type]} SOLO permite unidad 'UNIDAD'. No se puede cambiar a '${UNIT_OF_MEASURE_SYMBOLS[newUnit]}'`,
    };
  }

  // Si cambias a UNIDAD, cantidad debe ser entera
  if (newUnit === UnitOfMeasure.UNIDAD && !Number.isInteger(quantity)) {
    return {
      valid: false,
      message: `Al cambiar a unidad 'UNIDAD', la cantidad debe ser entera. Recibido: ${quantity}`,
    };
  }

  return { valid: true };
}

/**
 * Valida que la cantidad sea válida (positiva)
 */
export function validateQuantity(quantity: number): { valid: boolean; message?: string } {
  if (quantity === null || quantity === undefined) {
    return { valid: false, message: 'La cantidad no puede ser nula' };
  }
  if (quantity <= 0) {
    return { valid: false, message: 'La cantidad debe ser mayor a 0' };
  }
  return { valid: true };
}

/**
 * Validación completa para crear/actualizar un item de inventario
 */
export function validateInventoryItem(
  type: InventoryType,
  unit: UnitOfMeasure,
  quantity: number
): { valid: boolean; messages: string[] } {
  const messages: string[] = [];

  const quantityResult = validateQuantity(quantity);
  if (!quantityResult.valid) messages.push(quantityResult.message!);

  const consistencyResult = validateTypeAndUnitConsistency(type, unit, quantity);
  if (!consistencyResult.valid) messages.push(consistencyResult.message!);

  return {
    valid: messages.length === 0,
    messages,
  };
}

/**
 * Valida compatibilidad de unidades para ProductInventory (recetas)
 * Las unidades de la receta deben ser compatibles con las del inventario
 */
export function validateRecipeUnitCompatibility(
  recipeUnit: UnitOfMeasure,
  inventoryUnit: UnitOfMeasure
): { valid: boolean; message?: string } {
  if (!areUnitsCompatible(recipeUnit, inventoryUnit)) {
    const compatibleUnits = getCompatibleUnits(inventoryUnit);
    return {
      valid: false,
      message: `Unidades incompatibles: La receta usa ${UNIT_OF_MEASURE_SYMBOLS[recipeUnit]} (${UNIT_CATEGORY[recipeUnit]}) pero el inventario usa ${UNIT_OF_MEASURE_SYMBOLS[inventoryUnit]} (${UNIT_CATEGORY[inventoryUnit]}). Unidades válidas: ${compatibleUnits.map(u => UNIT_OF_MEASURE_SYMBOLS[u]).join(', ')}`,
    };
  }
  return { valid: true };
}

