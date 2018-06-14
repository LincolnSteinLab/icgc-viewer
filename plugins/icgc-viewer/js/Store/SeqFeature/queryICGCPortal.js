define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/request',
    'JBrowse/Store/SeqFeature',
    'JBrowse/Model/SimpleFeature'
],
function(
    declare,
    array,
    lang,
    request,
    SeqFeatureStore,
    SimpleFeature
) {
    return declare(SeqFeatureStore, {
        getFeatures: function(query, featureCallback, finishCallback, errorCallback) {
            function fetch() {
                var start = query.start;
                var end = query.end;
                var ref = query.ref

                // Hacky way of converting GenBank ID to Chr number
                var chr = parseInt(ref.split('|')[3].split('.')[0].replace(/\D/g,''))-662

                var url = encodeURI('https://dcc.icgc.org/api/v1/mutations?filters={"mutation":{"location":{"is":["' + chr + ':' + start + '-' + end + '"]}}}&from=1&include=consequences&size=100');
                return request(url, {
                    method: 'get',
                    headers: { 'X-Requested-With': null },
                    handleAs: 'json'
                }).then(function(res) {
                    array.forEach(res.hits, function(variant) {
                        featureCallback(new SimpleFeature({
                            id: variant.id,
                            data: {
                                start: variant.start,
                                end: variant.end,
                                name: variant.id,
                                info: variant.mutation,
                                genotypes: "variant.genotypes",
                                type: variant.type,
                                study: variant.study.join()
                            }
                        }));
                    });

                    finishCallback();
                }, function(err) {
                    console.log(err);
                    errorCallback('Error contacting ICGC Portal');
                });
            }
            fetch();
        }
    });
});