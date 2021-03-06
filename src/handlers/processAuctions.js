import { closeAuction } from "../lib/closeAuction";
import { getEndedAuctions } from "../lib/getEndedAuctions";
import createError from 'http-errors';

async function processAuctions(event, context) {
  const auctionsToClose = await getEndedAuctions();
  const closePromises = auctionsToClose.map(auction => closeAuction(auction));

  try {
    await Promise.all(closePromises);

    return { closed: closePromises.length };
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }
}

export const handler = processAuctions;
