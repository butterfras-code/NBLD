import React from 'react';

const TippingSection = ({ tippingInfo }) => {
    if (!tippingInfo || (!tippingInfo.venmo && !tippingInfo.cashapp)) {
        return null;
    }
    return (
        <div className="border-t border-gray-700 pt-4 mt-8 text-center">
            <p className="text-lg text-cyan-300 font-semibold mb-2">Enjoying the music? Tip the DJ!</p>
            {tippingInfo.venmo && <a href={`https://venmo.com/${tippingInfo.venmo}`} target="_blank" rel="noopener noreferrer" className="inline-block text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 my-2 mx-2">Venmo: @{tippingInfo.venmo}</a>}
            {tippingInfo.cashapp && <a href={`https://cash.app/$${tippingInfo.cashapp}`} target="_blank" rel="noopener noreferrer" className="inline-block text-white bg-green-500 hover:bg-green-600 rounded-lg px-4 py-2 my-2 mx-2">Cash App: ${tippingInfo.cashapp}</a>}
        </div>
    );
};

export default TippingSection;
