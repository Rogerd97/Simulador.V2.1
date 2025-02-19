// src/utils/parametria.js

import parametria from "../data/parametria.json";

export const getParametria = () => {
  return parametria;
};

// Función para calcular equivalencia en SMLV
const calcularSMLV = (monto) => {
  const SMLV = parametria.configuracionGeneral.salarioMinimo;
  console.log(`🔎 Salario Mínimo Legal Vigente (SMLV): ${SMLV}`);
  const montoEnSMLV = monto / SMLV;
  console.log(`📌 Monto convertido a SMLV: ${montoEnSMLV}`);
  return montoEnSMLV;
};

// Función para validar cédula para fondos especiales
export const validarCedulaFondoEspecial = (cedula) => {
  if (!cedula || !parametria.cedulasPermitidas) return 0;

  const { cedulasPermitidas } = parametria;
  const fechaActual = new Date();
  const fechaVigencia = new Date(cedulasPermitidas.vigenciaHasta);

  if (fechaActual > fechaVigencia) {
    return { error: "La vigencia del fondo ha expirado" };
  }

  const fondoAsignado = cedulasPermitidas.cedulas[cedula];
  return fondoAsignado || { error: "Cédula no autorizada" };
};

// Función para obtener tasa de interés
export const obtenerTasaInteres = (monto, modalidad, tipoCredito, zona) => {
  console.log("Entrada obtenerTasaInteres:", {
    monto,
    modalidad,
    tipoCredito,
    zona,
  });

  if (!parametria.tasasInteres || !parametria.tasasInteres[modalidad]) {
    console.log(
      "⚠️ Modalidad no encontrada en parametria.tasasInteres:",
      modalidad
    );
    return { ea: 0, mv: 0 };
  }

  const configuracionModalidad = parametria.tasasInteres[modalidad];

  if (!configuracionModalidad?.rangos) {
    console.log("⚠️ No hay rangos definidos para la modalidad:", modalidad);
    return { ea: 0, mv: 0 };
  }

  const rangoAplicable = configuracionModalidad.rangos.find((rango) => {
    const dentroDeRango =
      monto >= rango.rango.desde && monto <= rango.rango.hasta;

    if (!dentroDeRango) return false;

    if (modalidad === "MICROCREDITO") {
      if (Array.isArray(rango.tipos)) {
        return rango.tipos.includes(tipoCredito);
      }
      if (rango.tipo) {
        return rango.tipo === tipoCredito;
      }
      if (rango.tipos && typeof rango.tipos === "object") {
        return tipoCredito in rango.tipos;
      }
    } else {
      return rango.tipo === tipoCredito;
    }

    return false;
  });

  if (!rangoAplicable) {
    console.log("⚠️ No se encontró un rango aplicable para:", {
      monto,
      tipoCredito,
    });
    return { ea: 0, mv: 0 };
  }

  // ✅ Extraemos la variable tasas correctamente
  const tasas = rangoAplicable.tasas || { ea: 0, mv: 0 };
  console.log("✅ Rango aplicable encontrado:", rangoAplicable);
  console.log("✅ Tasa MV calculada:", tasas.mv);
  console.log("✅ Tasa EA calculada:", tasas.ea);

  // ✅ Aseguramos que siempre se retorna un objeto con valores válidos
  return { ea: tasas.ea || 0, mv: tasas.mv || 0 };
};

// Función para obtener forma de pago FNG
export const obtenerFormaPagoFNG = (codigoFNG) => {
  if (!codigoFNG) return "DIFERIDO";

  const producto = parametria.productosFNG[codigoFNG];
  if (!producto) return "DIFERIDO";

  if (producto.tipoComision === "SALDO_MENSUAL") {
    return "DIFERIDO";
  }

  return producto.formaPago || "DIFERIDO";
};

// Función para calcular comisión MiPyme (Solo aplica a MICROCREDITO)
export const calcularComisionMipyme = (monto, modalidad) => {
  if (!monto || !parametria.leyMipyme?.rangosSMLV) {
    console.warn("⚠️ No hay rangos de Ley MiPyme en la parametrización.");
    return 0;
  }

  if (modalidad !== "MICROCREDITO") {
    console.log("ℹ️ La Ley MiPyme solo aplica a MICROCREDITO.");
    return 0;
  }

  const SMLV = parametria.configuracionGeneral.salarioMinimo;

  // 🔹 Agregar depuración aquí
  console.log("🔎 Salario Mínimo Legal Vigente (SMLV):", SMLV);
  console.log("📌 Monto ingresado:", monto);
  console.log("📌 Monto convertido a SMLV:", monto / SMLV);

  const montoEnSMLV = monto / SMLV;

  console.log(`📌 Monto en SMLV: ${montoEnSMLV}`);
  console.log(
    "🔍 Rangos definidos en Ley MiPyme:",
    JSON.stringify(parametria.leyMipyme.rangosSMLV, null, 2)
  );

  const rango = parametria.leyMipyme.rangosSMLV.find(
    (r) => montoEnSMLV >= r.desde && montoEnSMLV < r.hasta // Nota: usamos < en `hasta`
  );

  if (!rango) {
    console.warn(`⚠️ No se encontró un rango para ${montoEnSMLV} SMLV.`);
    return 0;
  }

  console.log("✅ Comisión MiPyme encontrada:", rango.comision);
  return rango.comision || 0;
};

// Función para calcular costo de consulta a centrales
export const calcularCostoCentrales = (monto) => {
  if (!monto || !parametria.consultaCentrales?.rangosCredito) return 0;

  const SMLV = parametria.configuracionGeneral.salarioMinimo;
  const montoEnSMLV = monto / SMLV;

  const rango = parametria.consultaCentrales.rangosCredito.find(
    (r) => montoEnSMLV >= r.desde && montoEnSMLV <= r.hasta
  );

  return rango?.valorSMLV || 0;
};

// Función para validar rangos de montos
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

  if (plazoMeses < parametria.configuracionGeneral.plazoMinimo) {
    return {
      valido: false,
      mensaje: `El plazo mínimo debe ser de ${parametria.configuracionGeneral.plazoMinimo} meses`,
    };
  }

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
