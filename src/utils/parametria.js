// src/utils/parametria.js

// Importamos el archivo de parametría
import parametria from "../data/parametria.json";

export const getParametria = () => {
  return parametria;
};

// Función para determinar tipo de crédito según monto en SMLV
export const determinarTipoCredito = (monto, modalidad) => {
  const SMLV = parametria.configuracionGeneral.salarioMinimo;

  if (modalidad === "MICROCREDITO") {
    const montoEnSMLV = monto / SMLV;
    const rangos = parametria.rangosTipoCredito.MICROCREDITO;

    if (montoEnSMLV <= 6) return "POPULAR";
    if (montoEnSMLV <= 25) return "PRODUCTIVO";
    return "PRODUCTIVO_MAYOR_MONTO";
  }

  return modalidad;
};

// Función para validar si una cédula puede acceder a fondos especiales
export const validarCedulaFondoEspecial = (cedula) => {
  const { cedulasPermitidas } = parametria;
  const fechaActual = new Date();
  const fechaVigencia = new Date(cedulasPermitidas.vigenciaHasta);

  if (fechaActual > fechaVigencia) {
    return null;
  }

  return cedulasPermitidas.cedulas[cedula] || null;
};

// Función para obtener tasa de interés según configuración
export const obtenerTasaInteres = (monto, modalidad, tipoCredito, zona) => {
  const tasas = parametria.tasasInteres[modalidad];
  if (!tasas) return null;

  const rangos = tasas.rangos.find((rango) => {
    const montoAplica =
      monto >= rango.rango.desde &&
      (rango.rango.hasta === null || monto <= rango.rango.hasta);
    const tipoAplica = rango.tipos.includes(
      `${tipoCredito}_${zona.toUpperCase()}`
    );
    return montoAplica && tipoAplica;
  });

  return rangos ? rangos.tasas : null;
};

// Función para validar forma de pago FNG
export const obtenerFormaPagoFNG = (codigoFNG) => {
  const producto = parametria.productosFNG[codigoFNG];
  if (!producto) return null;
  return producto.formaPago;
};

// Función para calcular la comisión de la Ley MiPyme
export const calcularComisionMipyme = (monto) => {
  const SMLV = parametria.configuracionGeneral.salarioMinimo;
  const rangosMipyme = parametria.leyMipyme.rangosSMLV;
  const montoEnSMLV = monto / SMLV;

  const rango = rangosMipyme.find(
    (r) =>
      montoEnSMLV >= r.desde && (r.hasta === null || montoEnSMLV <= r.hasta)
  );

  return rango ? rango.comision : 0;
};

// Función para calcular costo de consulta a centrales
export const calcularCostoCentrales = (monto) => {
  const SMLV = parametria.configuracionGeneral.salarioMinimo;
  const rangosCentrales = parametria.consultaCentrales.rangosCredito;
  const montoEnSMLV = monto / SMLV;

  const rango = rangosCentrales.find(
    (r) =>
      montoEnSMLV >= r.desde && (r.hasta === null || montoEnSMLV <= r.hasta)
  );

  return rango ? rango.valorSMLV : 0;
};
