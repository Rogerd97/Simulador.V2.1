// src/utils/parametria.js

// utils/parametria.js

import parametria from "../data/parametria.json";

export const getParametria = () => {
  return parametria;
};

// Función para calcular equivalencia en SMLV
const calcularSMLV = (monto) => {
  const SMLV = parametria.configuracionGeneral.salarioMinimo;
  return monto / SMLV;
};

// Función para validar cédula para fondos especiales
export const validarCedulaFondoEspecial = (cedula) => {
  if (!cedula || !parametria.cedulasPermitidas) return 0;

  const { cedulasPermitidas } = parametria;
  const fechaActual = new Date();
  const fechaVigencia = new Date(cedulasPermitidas.vigenciaHasta);

  // Validar vigencia
  if (fechaActual > fechaVigencia) {
    return { error: "La vigencia del fondo ha expirado" };
  }

  // Validar si la cédula existe
  const fondoAsignado = cedulasPermitidas.cedulas[cedula];
  return fondoAsignado || { error: "Cédula no autorizada" };
};

// Función para obtener tasa de interés
export const obtenerTasaInteres = (monto, modalidad, tipoCredito, zona) => {
  console.log("Buscando tasa con parámetros:", {
    monto,
    modalidad,
    tipoCredito,
    zona,
  });

  const configuracionModalidad = parametria.tasasInteres[modalidad];
  if (!configuracionModalidad?.rangos) return 0;

  // Buscar rango aplicable
  const rangoAplicable = configuracionModalidad.rangos.find((rango) => {
    // Primero verificar el rango de monto
    const dentroDeRango =
      monto >= rango.rango.desde && monto <= rango.rango.hasta;
    if (!dentroDeRango) return false;

    console.log("Encontrado rango de monto válido:", rango);

    // Verificar el tipo según la estructura
    if (Array.isArray(rango.tipos)) {
      console.log(
        "Verificando tipo en array:",
        rango.tipos.includes(tipoCredito)
      );
      return rango.tipos.includes(tipoCredito);
    }

    if (rango.tipo) {
      console.log("Verificando tipo directo:", rango.tipo === tipoCredito);
      return rango.tipo === tipoCredito;
    }

    if (rango.tipos && typeof rango.tipos === "object") {
      console.log("Verificando tipo en objeto:", tipoCredito in rango.tipos);
      return tipoCredito in rango.tipos;
    }

    return false;
  });

  console.log("Rango aplicable encontrado:", rangoAplicable);

  if (!rangoAplicable) {
    console.log("No se encontró rango aplicable");
    return 0;
  }

  // Retornar la tasa según la estructura
  if (rangoAplicable.tasas?.mv !== undefined) {
    console.log("Retornando tasa directa:", rangoAplicable.tasas.mv);
    return rangoAplicable.tasas.mv;
  }

  if (
    rangoAplicable.tipos &&
    typeof rangoAplicable.tipos === "object" &&
    !Array.isArray(rangoAplicable.tipos)
  ) {
    console.log(
      "Retornando tasa de objeto:",
      rangoAplicable.tipos[tipoCredito]?.tasas?.mv
    );
    return rangoAplicable.tipos[tipoCredito]?.tasas?.mv || 0;
  }

  return 0;
};
// Función para obtener forma de pago FNG
export const obtenerFormaPagoFNG = (codigoFNG) => {
  if (!codigoFNG) return "DIFERIDO"; // valor por defecto

  const producto = parametria.productosFNG[codigoFNG];
  if (!producto) return "DIFERIDO";

  // Para productos que calculan sobre saldo, siempre es diferido
  if (producto.tipoComision === "SALDO_MENSUAL") {
    return "DIFERIDO";
  }

  return producto.formaPago || "DIFERIDO";
};

// Función para calcular comisión MiPyme
export const calcularComisionMipyme = (monto) => {
  if (!monto || !parametria.leyMipyme?.rangosSMLV) return 0;

  const montoEnSMLV = calcularSMLV(monto);
  const rango = parametria.leyMipyme.rangosSMLV.find(
    (r) => montoEnSMLV >= r.desde && montoEnSMLV <= r.hasta
  );

  return rango?.comision || 0;
};

// Función para calcular costo de consulta a centrales
export const calcularCostoCentrales = (monto) => {
  if (!monto || !parametria.consultaCentrales?.rangosCredito) return 0;

  const SMLV = parametria.configuracionGeneral.salarioMinimo;
  const montoEnSMLV = monto / SMLV;

  const rango = parametria.consultaCentrales.rangosCredito.find(
    (r) => montoEnSMLV >= r.desde && montoEnSMLV <= r.hasta
  );

  // Retornar directamente el valor fijo según el rango
  return rango?.valorSMLV || 0;
};

// Función auxiliar para validar rangos de montos
export const validarMontoRango = (monto, modalidad) => {
  if (!monto || !modalidad) return false;

  const configuracionModalidad = parametria.modalidades[modalidad];
  if (!configuracionModalidad?.montos) return false;

  return (
    monto >= configuracionModalidad.montos.minimo &&
    monto <= configuracionModalidad.montos.maximo
  );
};

// Función para obtener parámetros de producto FNG
export const obtenerParametrosFNG = (codigoFNG) => {
  if (!codigoFNG) return 0;

  const producto = parametria.productosFNG[codigoFNG];
  if (!producto) return 0;

  return {
    ...producto,
    requiereValidacionCedula: ["EMP080", "EMP280"].includes(codigoFNG),
  };
};

// Función para validar plazos
export const validarPlazo = (plazo, modalidadPago, productoFNG) => {
  if (!plazo || !modalidadPago)
    return { valido: false, mensaje: "Datos incompletos" };

  const mesesPorPeriodo =
    parametria.configuracionGeneral.modalidadesPago[modalidadPago];
  const plazoMeses = plazo * mesesPorPeriodo;

  // Validar plazo mínimo general
  if (plazoMeses < parametria.configuracionGeneral.plazoMinimo) {
    return {
      valido: false,
      mensaje: `El plazo mínimo debe ser de ${parametria.configuracionGeneral.plazoMinimo} meses`,
    };
  }

  // Validar plazos específicos del producto FNG
  if (productoFNG) {
    const producto = parametria.productosFNG[productoFNG];
    if (producto?.plazos) {
      if (plazoMeses < producto.plazos.minimo) {
        return {
          valido: false,
          mensaje: `El plazo mínimo para este producto es de ${producto.plazos.minimo} meses`,
        };
      }
      if (plazoMeses > producto.plazos.maximo) {
        return {
          valido: false,
          mensaje: `El plazo máximo para este producto es de ${producto.plazos.maximo} meses`,
        };
      }
    }
  }

  return { valido: true };
};
