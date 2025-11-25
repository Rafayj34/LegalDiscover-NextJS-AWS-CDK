export const lambdaResponse = (status: number, data: any) => ({
  statusCode: status,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
  },
  body: JSON.stringify(data),
});

export default lambdaResponse;