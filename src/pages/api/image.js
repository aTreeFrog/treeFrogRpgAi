// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import axios from 'axios';
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
    const referer = req.headers.referer || req.headers.referrer; // get the referer from the request headers

    console.log("server am i here?");
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method should be POST' });
    } else if (process.env.NODE_ENV !== "development") {
        if (!referer || referer !== process.env.APP_URL) {
            res.status(401).json({ message: 'Unauthorized' });
        }
    }
    else {
        try {

            const { body } = req;
            const image = await openai.images.generate(body);
            console.log(image.data);
            res.status(200).json(image);

        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Something went wrong" });
        }
    }

}
