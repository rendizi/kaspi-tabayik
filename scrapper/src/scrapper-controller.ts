import puppeteer, { Page } from "puppeteer";
import { ScrapperService } from "./scrapper-service";
import * as fs from 'fs/promises'; // Use promises-based fs for async operations

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
            console.log(categories[0].subcategory)
            for(const subCategories of categories[0].subcategory){
                for(const subsubcategories of subCategories.subsubcategory){
                    const products = await this.scrapperService.GetProducts(page, subsubcategories.link, subCategories.name)
                    subsubcategories.products = products               
                }
                const fileName = `${subCategories.name.toLowerCase()}.json`;
                await fs.writeFile("../"+fileName, JSON.stringify(subCategories, null, 2), 'utf8');
            }
        } catch (error) {
            console.error('Error in getCategories:', error);
            throw error;
        } finally {
            await browser.close();
        }
    }

    async GetProducts(){

    }
}