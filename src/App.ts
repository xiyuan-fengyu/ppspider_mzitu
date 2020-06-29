import {AddToQueue, appInfo, FileUtil, FromQueue, Job, Launcher, OnStart, OnTime, RequestUtil} from "ppspider";
import * as Cheerio from "cheerio";

class MzituTask {

    @OnStart({urls: "https://www.mzitu.com/", timeout: 30000})
    @OnTime({urls: "https://www.mzitu.com/", cron: "0 0 12 * * *", timeout: 30000}) // cron
    @FromQueue({name: "pageUrls", timeout: 30000, parallel: 1, exeInterval: 100})
    @AddToQueue([
        {name: "detailUrls"},
        {name: "pageUrls"},
    ])
    async list(job: Job) {
        const htmlRes = await RequestUtil.simple({
            url: job.url,
            proxy: "http://localhost:2007",
            headerLines: `
            accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
            accept-encoding: gzip, deflate, br
            accept-language: zh-CN,zh;q=0.9
            cache-control: max-age=0
            cookie: Hm_lvt_cb7f29be3c304cd3bb0c65a4faa96c30=1593079690,1593333996; views=17; Hm_lpvt_cb7f29be3c304cd3bb0c65a4faa96c30=1593338078
            referer: https://www.mzitu.com/page/2/
            sec-fetch-dest: document
            sec-fetch-mode: navigate
            sec-fetch-site: same-origin
            sec-fetch-user: ?1
            upgrade-insecure-requests: 1
            user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36
            `
        });
        const $ = Cheerio.load(htmlRes.body);

        // jquery css selector
        const detailUrls = $("#pins > li > a").map((index, ele) => {
            const href = ele.attribs.href;
            // href=""
            if (href && href.match("https://www.mzitu.com/\\d+")) {
                return href;
            }
        }).filter(item => item != null).get();
        const pageUrls = $(".nav-links a.page-numbers").map((index, ele) => {
            const href = ele.attribs.href;
            // href=""
            if (href && href.match("https://www.mzitu.com/page/\\d+")) {
                return href;
            }
        }).filter(item => item != null).get();
        return {
            detailUrls: detailUrls,
            pageUrls: pageUrls
        };
    }

    @FromQueue({name: "detailUrls", parallel: 1, exeInterval: 100, timeout: 30000})
    @AddToQueue({name: "detailUrls"})
    async detail(job: Job) {
        const htmlRes = await RequestUtil.simple({
            url: job.url,
            proxy: "http://localhost:2007",
            headerLines: `
            accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
            accept-encoding: gzip, deflate, br
            accept-language: zh-CN,zh;q=0.9
            cache-control: max-age=0
            cookie: Hm_lvt_cb7f29be3c304cd3bb0c65a4faa96c30=1593079690,1593333996; views=17; Hm_lpvt_cb7f29be3c304cd3bb0c65a4faa96c30=1593338103
            referer: https://www.mzitu.com/236819
            sec-fetch-dest: document
            sec-fetch-mode: navigate
            sec-fetch-site: same-origin
            sec-fetch-user: ?1
            upgrade-insecure-requests: 1
            user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36
            `
        });
        const $ = Cheerio.load(htmlRes.body);
        const imgSrc = $(".main-image p a img")[0].attribs.src;
        // src="https://i3.mmzztt.com/2020/06/17a02.jpg"
        const imgNameM = imgSrc.match("https://i3.mmzztt.com/(\\d+)/(\\d+)/(.*\\.jpg)");
        const imgName = imgNameM[1] + imgNameM[2] + imgNameM[3];
        const imgRes = await RequestUtil.simple({
            url: imgSrc,
            proxy: "http://localhost:2007",
            headerLines: `
            Referer: ${job.url}
            User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36
            `
        });
        FileUtil.write(appInfo.workplace + "/mzitu/" + imgName, imgRes.body);

        return $(".pagenavi > a").map((index, ele) => {
            const href = ele.attribs.href;
            // href=""
            if (href && href.match("https://www.mzitu.com/\\d+")) {
                return href;
            }
        }).filter(item => item != null).get();
    }

}

@Launcher({
    workplace: "workplace_mzitu",
    tasks: [
        MzituTask
    ],
    workerFactorys: [
        // new PuppeteerWorkerFactory({
        //     headless: false
        // })
    ]
})
class App {}
