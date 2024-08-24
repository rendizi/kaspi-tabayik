import puppeteer, { Page } from "puppeteer";
import { ScrapperService } from "./scrapper-service";

export class ScrapperController {
    private scrapperService: ScrapperService;

    constructor() {
        this.scrapperService = new ScrapperService();
    }

    async getCategories() {
        const browser = await puppeteer.launch({ headless: false });
        const page: Page = await browser.newPage();

        try {
            const categories = await this.scrapperService.getCategories(page);
            for(const subCategories of categories[0].subcategory){
                for(const subsubcategories of subCategories.subsubcategory){
                    console.log(subsubcategories)
                }
            }
        } catch (error) {
            console.error('Error in getCategories:', error);
            throw error;
        } finally {
            await browser.close();
        }
    }
}