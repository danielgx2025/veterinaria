// express-async-errors no incluye tipos propios. Es un import de side-effect
// que parchea el Router de Express para capturar rechazos de funciones async
// y enviarlos al middleware de errores en vez de crashear el proceso.
declare module 'express-async-errors';
