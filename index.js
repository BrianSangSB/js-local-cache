

const APP_ID = 'YOUR SENDBIRD APP ID HERE';
var USER_ID = 'YOUR USER ID HERE';
var ACCESS_TOKEN = null;
var sb;
const USE_LOCAL_CACHE = false;


// Init Sendbird
sb = new SendBird({ appId: APP_ID, localCacheEnabled: USE_LOCAL_CACHE });
// Connect to chat
sb.connect(USER_ID, ACCESS_TOKEN, (user, error) => {
    if (error) {
        console.log('Unable to connect. You need to get a first connection to access Local Cache');
    } else {
        getChannelList((channels) => {
            console.log(channels);
            console.log('DONE CHANNELS');
            if (channels && Array.isArray(channels)) {
                for (let channel of channels) {
                    getMessages(channel, messages => {
                        console.log('MESSAGES FROM CACHE', messages);
                    }, messages => {
                        console.log('MESSAGES FROM SERVER', messages);
                    })
                }    
            }
        });
        setMessageHandler();
    }
})


function setMessageHandler(messageCollection) {
    var messageCollectionHandler = {
        onMessagesAdded: function (context, channel, messages) {
            // Add the messages to your data source.
            console.log('MESSAGES ADDED', messages);
        },
        onMessagesUpdated: function (context, channel, messages) {
            // Update the messages in your data source.
        },
        onMessagesDeleted: function (context, channel, messages) {
            // Remove the messages from the data source.
        },
        onChannelUpdated: function (context, channel) {
            // Change the chat view with the updated channel information.
        },
        onChannelDeleted: function (context, channelUrl) {
            // This is called when a channel was deleted. So the current chat view should be cleared.
        },
        onHugeGapDetected: function () {
            // The Chat SDK detects more than 300 messages missing.
        }
    };
    if (messageCollection) {
        messageCollection.setMessageCollectionHandler(messageCollectionHandler);
    }
}



function getMessages(groupChannel, cacheCallback, serverCallback) {

    var messageFilter = new sb.MessageFilter();

    var startingPoint = Date.now();
    var messageCollectionFetchLimit = 100;
    var messageCollection = groupChannel.createMessageCollection()
        .setFilter(messageFilter)
        .setStartingPoint(startingPoint)
        .setLimit(messageCollectionFetchLimit)
        .build();

    messageCollection
        .initialize(sb.MessageCollection.MessageCollectionInitPolicy.CACHE_AND_REPLACE_BY_API)
        .onCacheResult(function (err, messages) {
            // Messages will be retrieved from the local cache.
            // They might be too outdated or far from the startingPoint.
            cacheCallback(messages);
        })
        .onApiResult(function (err, messages) {
            // Messages will be retrieved from the Sendbird server through API.
            // According to the MessageCollectionInitPolicy.CACHE_AND_REPLACE_BY_API,
            // the existing data source needs to be cleared
            // before adding retrieved messages to the local cache.
            serverCallback(messages);
        });

    setMessageHandler(messageCollection);
}


function getChannelList(callback) {
    // Set your filters
    var groupChannelFilter = new sb.GroupChannelFilter();
    groupChannelFilter.includeEmpty = true;

    // Define your channel sort order
    const order = sb.GroupChannelCollection.GroupChannelOrder.LATEST_LAST_MESSAGE;

    // Create the Builder
    var groupChannelCollection = sb.GroupChannel.createGroupChannelCollection()
        .setOrder(order)
        .setFilter(groupChannelFilter)
        .build();

    // This handler will get the information
    groupChannelCollection.setGroupChannelCollectionHandler({
        onChannelsAdded: (context, channels) => {
            console.log('Local cache: onChannelsAdded', channels);
            callback({
                action: 'add',
                context,
                channels
            })
        },
        onChannelsUpdated: (context, channels) => {
            console.log('Local cache: onChannelsUpdated', channels);
            callback({
                action: 'update',
                context,
                channels
            })
        },
        onChannelsDeleted: (context, channelUrls) => {
            console.log('Local cache: onChannelsDeleted', channelUrls);
            callback({
                action: 'delete',
                context,
                channelUrls
            })
        },
    });

    // Request the info
    try {
        groupChannelCollection.loadMore().then((channels) => {
            callback(channels);
        });
    } catch (e) {
        console.log('Error getting channels', e);
    }
}
