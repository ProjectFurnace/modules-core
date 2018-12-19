const simplejson = require('@project-furnace/simplejsonutils');

function mapPort(event, lookup, portField, outputPortField) {
  // get the protocol of the event first
  // try {
  const protonum = simplejson.getPath(event, 'network.ip.proto');
  // we only have tables for UDP and TCP ports
  if (protonum === 6 || protonum === 17) {
    const proto = (protonum === 6 ? 'tcp' : 'udp');
    // get the data from the port number specified in portField and using the appropiate table
    const portData = lookup[proto].get(simplejson.getPath(event, portField));

    if (portData) {
      // eslint-disable-next-line no-param-reassign
      event.network[outputPortField] = portData;
    } else {
      simplejson.merge(event, { meta: { lookup: { port: { error: 'Undefined port data', field: portField } } } });
    }
  } else {
    simplejson.merge(event, { meta: { lookup: { port: { error: 'No network.ip.proto field' } } } });
  }
  /* } catch (e) {
    simplejson.merge(event, { meta: { lookup: { port: { error: 'No network.ip.proto field' } } } });
  } */

  return event;
}

module.exports.mapPort = mapPort;
