import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import validator from '@middy/validator';
import createError from 'http-errors';
import { setAuctionPictureUrl } from '../lib/setAuctionPictureUrl';
import { uploadPictureToS3 } from "../lib/uploadPictureToS3";
import { getAuctionById } from "./getAuction";
import uploadAuctionPictureSchema from '../lib/schema/uploadAuctionPictureSchema';
import cors from '@middy/http-cors';

async function uploadAuctionPicture(event) {
    const { id } = event.pathParameters;
    const { email } = event.requestContext.authorizer;

    const auction = await getAuctionById(id);

    // Validate auction ownership
    if (email !== auction.seller) {
        throw new createError.Forbidden('You are not the seller of this auction');
    }

    const base64 = event.body.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    let updatedAuction;
    try {
        const pictureUrl = await uploadPictureToS3(auction.id + '.jpg', buffer);

        updatedAuction = await setAuctionPictureUrl(auction.id, pictureUrl);
    } catch (error) {
        console.error(error);
        throw new createError.InternalServerError(error);
    }

    return {
        statusCode: 200,
        body: JSON.stringify(updatedAuction)
    };
}

export const handler = middy(uploadAuctionPicture)
    .use(httpErrorHandler())
    .use(validator({
        inputSchema: uploadAuctionPictureSchema,
        ajvOptions: {
            strict: false,
        }
    }))
    .use(cors());