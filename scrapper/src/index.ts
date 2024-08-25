import { ScrapperController } from "./scrapper-controller";
import dotenv from "dotenv"

dotenv.config();

const some = () => {
    const scrapperContro = new ScrapperController()
    scrapperContro.getCategories()
}

some()