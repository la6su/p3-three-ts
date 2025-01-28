export namespace XHRFactory {
    namespace config {
        let withCredentials: boolean;
        let customHeaders: {
            header: any;
            value: any;
        }[];
    }
    function createXMLHttpRequest(): XMLHttpRequest;
}
