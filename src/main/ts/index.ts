import * as Path from "path";
import * as Express from "express";
import * as Bodyparser from "body-parser";
import * as Fs from "fs-extra";
import * as TarGz from "targz";
import TestRunner from "./test/runner";

const childrenIpAddresses = getChildrenIPAddresses();
const testRunner = new TestRunner(childrenIpAddresses);
const app = Express();
const port = 3000;
global.status = 'idle';

const downloadPath = Path.posix.join(Path.posix.sep, 'test-runner', 'data', 'downloads');
Fs.ensureDirSync(downloadPath);
app.use('/reports', Express.static(Path.join(Path.sep, 'test-runner', 'reports')));
app.use('/data/dumps', Express.static(Path.join(Path.sep, 'test-runner', 'data','dumps')));

function getChildrenIPAddresses(): string[] {
    try {
        return JSON.parse(process.env.CHILDREN);
    } catch (e) {
        console.error("Unable to parse env.ENTRYPOINTS");
    }
    return [];
}

process.env.HFC_LOGGING = '{"error":"console"}';

app.listen(port, (err: string) => {
    if (err) {
        return console.log('Error while listening to :', err);
    }

    console.log(`server is listening on ${port}`)
});


app.use('/test-runner/reports', Express.static('reports'));

app.get('/', (request, response) => {
    response.send('Ready for requests!');
});

app.get('/start', (request, response) => {
    response.send("Starting");
    (async () => {
        try {
            // await test.start();
            await testRunner.start();
        }
        catch (e) {
            global.status = 'error';
            console.error(e);
        }
    })();
});
app.get('/stop', (request, response) => {
    response.send("Stopping");
    console.log("Stopping test runner");
    testRunner.stop();
    console.log("Stopped test runner");
});

app.get('/status', (request, response) => {
    response.send(global.status);
});

app.post('/block', Bodyparser.json(), function (request, response) {
    testRunner.handleBlock(request, response);
    return response.sendStatus(200);
});

app.get('/data/download', (request, response) => {
    const filename = `test-results-${new Date(Date.now()).toISOString()}.tar.gz`;
    const path = Path.join(downloadPath, filename);
    TarGz.compress({
        src: Path.join(Path.sep, 'test-runner', 'data', 'dumps'),
        dest: path
    }, function(err){
        if(err) {
            console.log(err);
        } else {
            response.download(path, filename);
        }
    });
});

process.on('unhandledRejection', (warning, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', warning);
    // application specific logging, throwing an error, or other logic here
    console.log(warning.stack)
});