// Merged Observer: Hide elements and auto-paste when input is enabled
function createMergedObserver() {
    
    // Function to hide unwanted elements
    function hideElements() {
        const popupGlass = document.querySelector('.gwt-PopupPanelGlass');
        if (popupGlass && popupGlass.style.display !== 'none') {
            popupGlass.style.display = 'none';
            console.log('Popup glass hidden by observer');
        }

        const challengeDialog = document.querySelector('.challengePromptDialog');
        if (challengeDialog && challengeDialog.style.visibility !== 'hidden') {
            challengeDialog.style.visibility = 'hidden';
            console.log('Challenge dialog hidden by observer');
        }
    }

    // Track if we're already waiting to paste
    let waitingToPaste = false;
    let pasteTimeoutId = null;
    let inputWasDisabled = true; // Track previous state

    // Function to get text from spans and paste to input
    function pasteTextToInput() {
        const input = document.querySelector('.txtInput');
        
        // Check if input exists
        if (!input) {
            return;
        }

        const isCurrentlyEnabled = !input.disabled && !input.readOnly;
        
        // If input was disabled and is now enabled, start the timer
        if (inputWasDisabled && isCurrentlyEnabled) {
            inputWasDisabled = false;
            
            // Cancel any existing timer
            if (pasteTimeoutId) {
                clearTimeout(pasteTimeoutId);
            }
            
            // Check if input already has text (avoid re-pasting)
            if (input.value.trim() !== '') {
                return;
            }
            
            waitingToPaste = true;
            console.log('Input enabled - waiting 3 seconds before pasting...');
            
            pasteTimeoutId = setTimeout(() => {
                // Double-check input is still enabled and empty
                if (input && !input.disabled && !input.readOnly && input.value.trim() === '') {
                    // Get all spans with unselectable attribute
                    const unselectableSpans = document.querySelectorAll('span[unselectable]');
                    
                    // Also get spans without unselectable attribute (to get complete text)
                    const allSpans = document.querySelectorAll('span');
                    const selectableSpans = Array.from(allSpans).filter(span => !span.hasAttribute('unselectable'));

                    // Combine text from both types
                    let fullText = '';
                    
                    // Add text from unselectable spans
                    unselectableSpans.forEach(span => {
                        fullText += span.innerText || span.textContent || '';
                    });
                    
                    // Add text from selectable spans
                    selectableSpans.forEach(span => {
                        fullText += span.innerText || span.textContent || '';
                    });

                    // Paste text to input if we have text
                    if (fullText.trim() !== '') {
                        input.value = fullText;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log('Text pasted to input after 3 seconds:', fullText);
                    }
                }
                
                // Reset waiting state
                waitingToPaste = false;
            }, 3000); // 3 seconds delay
        }
        
        // If input is disabled, update the state
        if (!isCurrentlyEnabled) {
            if (!inputWasDisabled) {
                console.log('Input disabled');
            }
            inputWasDisabled = true;
            
            // Cancel any pending paste
            if (waitingToPaste) {
                clearTimeout(pasteTimeoutId);
                waitingToPaste = false;
                console.log('Paste timer cancelled - input disabled');
            }
        }
    }

    // Combined function to run both operations
    function runAllOperations() {
        hideElements();
        pasteTextToInput();
    }

    // Initial run
    runAllOperations();

    // Create MutationObserver
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            // Check for DOM changes (new elements added)
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                runAllOperations();
            }
            
            // Check for attribute changes (like disabled being removed)
            if (mutation.type === 'attributes') {
                runAllOperations();
            }
        });
    });

    // Start observing the document
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['disabled', 'readonly', 'style', 'class']
    });

    // Also run periodically as fallback (every 200ms)
    const intervalId = setInterval(runAllOperations, 200);

    // Inject CSS to force hide elements (most reliable method)
    function injectHidingCSS() {
        if (!document.getElementById('element-hider-css')) {
            const style = document.createElement('style');
            style.id = 'element-hider-css';
            style.textContent = `
                .gwt-PopupPanelGlass { 
                    display: none !important; 
                }
                .challengePromptDialog { 
                    visibility: hidden !important; 
                }
            `;
            document.head.appendChild(style);
            console.log('CSS injected to hide elements');
        }
    }

    injectHidingCSS();

    console.log('Merged observer started - hiding elements and watching for enabled input');

    // Return function to stop all observers
    return function stopObserver() {
        observer.disconnect();
        clearInterval(intervalId);
        if (pasteTimeoutId) {
            clearTimeout(pasteTimeoutId);
        }
        const injectedCSS = document.getElementById('element-hider-css');
        if (injectedCSS) {
            injectedCSS.remove();
        }
        console.log('All observers stopped, timers cleared, and CSS removed');
    };
}

// Start the merged observer
const stopAllObservers = createMergedObserver();

// To stop all observers later if needed:
// stopAllObservers();
